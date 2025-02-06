import React, { useEffect, useState } from 'react';

// Base URL for music files
const baseUrl = 'https://d3obicoq6somxl.cloudfront.net/background_music/';

const emotionToMusic = {
  angry: ['anger/anger1.mp3', 'anger/anger2.mp3', 'anger/anger3.mp3', 'anger/anger4.mp3', 'anger/anger5.mp3'],
  disappointed: [
    'disappointment/disappointment1.mp3',
    'disappointment/disappointment2.mp3',
    'disappointment/disappointment3.mp3',
    'disappointment/disappointment4.mp3',
    'disappointment/disappointment5.mp3'
  ],
  fear: ['fear/fear1.mp3', 'fear/fear2.mp3', 'fear/fear3.mp3', 'fear/fear4.mp3'],
  frustrated: [
    'frustration/frustration1.mp3',
    'frustration/frustration2.mp3',
    'frustration/frustration3.mp3',
    'frustration/frustration4.mp3',
    'frustration/frustration5.mp3'
  ],
  guilt: ['guilt/guilt1.mp3', 'guilt/guilt2.mp3', 'guilt/guilt3.mp3', 'guilt/guilt4.mp3'],
  sad: ['sad/sad1.mp3', 'sad/sad2.mp3', 'sad/sad3.mp3', 'sad/sad4.mp3', 'sad/sad5.mp3']
};

const BackgroundMusic = ({ emotion }) => {
  const [audio, setAudio] = useState(null);

  useEffect(() => {
    if (audio) {
      audio.pause();
    }

    const musicFiles = emotionToMusic[emotion] || [];
    if (musicFiles.length === 0) return;

    const randomIndex = Math.floor(Math.random() * musicFiles.length);
    const selectedMusic = `${baseUrl}${musicFiles[randomIndex]}`;

    const newAudio = new Audio(selectedMusic);
    newAudio.loop = true;
    newAudio.volume = 0.1;
    newAudio.play();

    setAudio(newAudio);

    return () => {
      if (newAudio) {
        newAudio.pause();
      }
    };
  }, [emotion]);

  return null;
};

export default BackgroundMusic;
