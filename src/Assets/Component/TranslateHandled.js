import translate from 'google-translate-api-x';
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';

const TranslateHandled = async({ text }) => {
    const [data, setData] = useState(text);
    const [loading, setLoading] = useState(true);
    const selectedCode = useSelector(state => state.language.langCode);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const lg = await translate(text, {
                    // from: "en",
                    to: selectedCode,
                    // forceBatch: false
                });
                // console.log('text=========>', lg.text)
                if (lg.text) {
                    setData(lg.text);
                } else {
                    setData(text);
                }

            } catch (error) {
                // setData(text);
                console.error(error);
            } finally {
                // setData(text);
                setLoading(false);
            }
        };

        fetchData();
        setLoading(true);
    }, [selectedCode]);

    // if (loading) {
    //     return <LoaderKit
    //         style={{ width: 30, height: 30 }}
    //         name={'BallPulse'} // Optional: see list of animations below
    //         color={'#2048BD'} // Optional: color can be: 'red', 'green',... or '#ddd', '#ffffff',...
    //     />
    // }

    return (
        <Text>{data || text}</Text>
    );
};

export default TranslateHandled;