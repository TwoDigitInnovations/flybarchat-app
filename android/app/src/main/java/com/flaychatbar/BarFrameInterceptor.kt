package com.flaychatbar

import android.content.Context
import android.graphics.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.Segmentation
import com.google.mlkit.vision.segmentation.SegmentationMask
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import org.webrtc.CapturerObserver
import org.webrtc.JavaI420Buffer
import org.webrtc.VideoFrame
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Singleton that intercepts WebRTC camera frames and composites
 * bar background + person cutout + table overlay.
 *
 * Activated automatically when VideoCallScreen starts.
 * Sits directly in the WebRTC capture pipeline via patched GetUserMediaImpl.
 */
class BarFrameInterceptor private constructor(private val context: Context) : com.oney.WebRTCModule.FrameProcessor {

    companion object {
        @Volatile
        var instance: BarFrameInterceptor? = null

        fun init(context: Context) {
            if (instance == null) {
                synchronized(this) {
                    if (instance == null) {
                        instance = BarFrameInterceptor(context.applicationContext)
                        // Register into the webrtc module's registry
                        com.oney.WebRTCModule.FrameProcessorRegistry.instance = instance
                    }
                }
            }
        }
    }

    private val executor = Executors.newSingleThreadExecutor()
    private val busy = AtomicBoolean(false)
    private var enabled = true

    private val bgBitmaps = mutableListOf<Bitmap>()  // replaces bgBitmap
    private var selectedBgBitmap: Bitmap? = null       // this user's assigned bg
    // private var bgBitmap: Bitmap? = null
    private var tableBitmap: Bitmap? = null

    private val segmenter = Segmentation.getClient(
        SelfieSegmenterOptions.Builder()
            .setDetectorMode(SelfieSegmenterOptions.STREAM_MODE)
            .enableRawSizeMask()
            .build()
    )

    init {
        loadAssets()
    }

    private fun loadAssets() {
    executor.execute {
        try {
            for (i in 1..4) {
                context.assets.open("bar/bar_bg_$i.png").use {
                    val bmp = BitmapFactory.decodeStream(it)
                    if (bmp != null) bgBitmaps.add(bmp)
                    android.util.Log.d("BarBG", "✅ bar_bg_$i.png loaded")
                }
            }
            // Pick one randomly for this user, stays fixed for the call
            selectedBgBitmap = bgBitmaps.random()

            context.assets.open("bar/bar_table.png").use {
                tableBitmap = BitmapFactory.decodeStream(it)
            }
        } catch (e: Exception) {
            android.util.Log.e("BarBG", "❌ Asset load failed: ${e.message}")
        }
    }
}

    override fun isEnabled() = enabled
    fun setEnabled(value: Boolean) { enabled = value }

    override fun onStarted() {
        android.util.Log.d("BarBG", "Capturer started — interceptor active")
    }

    override fun processFrame(frame: VideoFrame, downstream: CapturerObserver) {
        // If busy or assets not loaded, pass through unchanged
        if (busy.getAndSet(true) || selectedBgBitmap == null) {
            downstream.onFrameCaptured(frame)
            if (!busy.compareAndSet(true, false)) busy.set(false)
            return
        }

        frame.retain()

        executor.execute {
            try {
                val i420 = frame.buffer.toI420()
                if (i420 == null) {
                    downstream.onFrameCaptured(frame)
                    busy.set(false)
                    frame.release()
                    return@execute
                }

                val bmp = yuv420ToBitmap(i420) ?: run {
                    i420.release()
                    downstream.onFrameCaptured(frame)
                    busy.set(false)
                    frame.release()
                    return@execute
                }
                i420.release()

                // Apply rotation so face is upright for segmentation
                val rotated = rotateBitmap(bmp, frame.rotation)

                val image = InputImage.fromBitmap(rotated, 0)
                segmenter.process(image)
                    .addOnSuccessListener { mask ->
                        try {
                            val composited = composite(rotated, mask)
                            // Rotate back to original orientation
                            val final = rotateBitmap(composited, -frame.rotation)
                            val newFrame = bitmapToVideoFrame(final, frame.timestampNs, frame.rotation)
                            downstream.onFrameCaptured(newFrame)
                            newFrame.release()
                        } catch (e: Exception) {
                            android.util.Log.e("BarBG", "Composite error: ${e.message}")
                            downstream.onFrameCaptured(frame)
                        } finally {
                            busy.set(false)
                            frame.release()
                        }
                    }
                    .addOnFailureListener { e ->
                        android.util.Log.e("BarBG", "Segmentation failed: ${e.message}")
                        downstream.onFrameCaptured(frame)
                        busy.set(false)
                        frame.release()
                    }
            } catch (e: Exception) {
                android.util.Log.e("BarBG", "processFrame error: ${e.message}")
                downstream.onFrameCaptured(frame)
                busy.set(false)
                frame.release()
            }
        }
    }

    private fun composite(person: Bitmap, mask: SegmentationMask): Bitmap {
        val w = person.width
        val h = person.height
        val bg = selectedBgBitmap!! 
        val scaledBg = Bitmap.createScaledBitmap(bg, w, h, true)

        val output = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)

        // 1. Draw bar background
        canvas.drawBitmap(scaledBg, 0f, 0f, null)

        // 2. Cut person out using mask
        val maskBuf = mask.buffer.also { it.rewind() }
        val maskW = mask.width
        val maskH = mask.height
        val pixels = IntArray(w * h)
        person.getPixels(pixels, 0, w, 0, 0, w, h)

        for (y in 0 until h) {
            for (x in 0 until w) {
                val mx = (x * maskW / w).coerceIn(0, maskW - 1)
                val my = (y * maskH / h).coerceIn(0, maskH - 1)
                val confidence = maskBuf.getFloat((my * maskW + mx) * 4)
                if (confidence < 0.5f) pixels[y * w + x] = Color.TRANSPARENT
            }
        }

        val cutout = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        cutout.setPixels(pixels, 0, w, 0, 0, w, h)

        // 3. Draw person over background
        canvas.drawBitmap(cutout, 0f, 0f, null)

        // 4. Draw table in bottom 35%
        tableBitmap?.let { table ->
            val tableH = (h * 0.35f).toInt()
            val scaledTable = Bitmap.createScaledBitmap(table, w, tableH, true)
            val offsetY = (h * 0.08f)
            canvas.drawBitmap(scaledTable, 0f, (h - tableH).toFloat() + offsetY, null)
        }

        return output
    }

    private fun rotateBitmap(bmp: Bitmap, degrees: Int): Bitmap {
        if (degrees == 0) return bmp
        val m = Matrix().apply { postRotate(degrees.toFloat()) }
        return Bitmap.createBitmap(bmp, 0, 0, bmp.width, bmp.height, m, true)
    }

    private fun yuv420ToBitmap(i420: VideoFrame.I420Buffer): Bitmap? {
        return try {
            val w = i420.width
            val h = i420.height
            val pixels = IntArray(w * h)
            val yBuf = i420.dataY
            val uBuf = i420.dataU
            val vBuf = i420.dataV

            for (j in 0 until h) {
                for (i in 0 until w) {
                    val y = yBuf.get(j * i420.strideY + i).toInt() and 0xFF
                    val u = (uBuf.get((j / 2) * i420.strideU + i / 2).toInt() and 0xFF) - 128
                    val v = (vBuf.get((j / 2) * i420.strideV + i / 2).toInt() and 0xFF) - 128
                    pixels[j * w + i] = (0xFF shl 24) or
                        ((y + 1.402 * v).toInt().coerceIn(0, 255) shl 16) or
                        ((y - 0.344136 * u - 0.714136 * v).toInt().coerceIn(0, 255) shl 8) or
                        (y + 1.772 * u).toInt().coerceIn(0, 255)
                }
            }
            Bitmap.createBitmap(pixels, w, h, Bitmap.Config.ARGB_8888)
        } catch (e: Exception) { null }
    }

    private fun bitmapToVideoFrame(bmp: Bitmap, tsNs: Long, rotation: Int): VideoFrame {
        val w = bmp.width; val h = bmp.height
        val buf = JavaI420Buffer.allocate(w, h)
        val pixels = IntArray(w * h)
        bmp.getPixels(pixels, 0, w, 0, 0, w, h)

        for (j in 0 until h) {
            for (i in 0 until w) {
                val p = pixels[j * w + i]
                val r = (p shr 16) and 0xFF
                val g = (p shr 8) and 0xFF
                val b = p and 0xFF
                buf.dataY.put(j * buf.strideY + i,
                    (0.299 * r + 0.587 * g + 0.114 * b).toInt().coerceIn(0,255).toByte())
                if (j % 2 == 0 && i % 2 == 0) {
                    buf.dataU.put((j/2) * buf.strideU + i/2,
                        (-0.169*r - 0.331*g + 0.5*b + 128).toInt().coerceIn(0,255).toByte())
                    buf.dataV.put((j/2) * buf.strideV + i/2,
                        (0.5*r - 0.419*g - 0.081*b + 128).toInt().coerceIn(0,255).toByte())
                }
            }
        }
        return VideoFrame(buf, rotation, tsNs)
    }

    fun close() {
        segmenter.close()
        executor.shutdown()
    }
}