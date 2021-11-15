import librosa, librosa.display
import matplotlib.pyplot as plt
import soundfile as sf
import numpy as np
import IPython.display as ipd
import random
import math
import cv2

class AudioSignal:
    def __init__(self, hertz):
        self.hertz = hertz
        
    def load_audio(self, sound_source):
        if(type(sound_source) is str):
            self.signal, self.sr = librosa.load(sound_source, sr=self.hertz)
        else:
            self.signal = sound_source
            self.sr = self.hertz
        
    def plot_amplitude(self):
        librosa.display.waveplot(self.signal, sr=self.hertz)
        plt.xlabel("time")
        plt.ylabel("amplitude")
        plt.show()
        
    def mix_noise(self, noise_path):
        noise_signal, noise_sr = librosa.load(noise_path, sr=self.hertz)
        while(noise_signal.shape[0] < self.signal.shape[0]):
            noise_signal = np.concatenate((noise_signal, noise_signal))
        noise_signal = noise_signal[:self.signal.shape[0]]
        wav_with_bg = self.signal * np.random.uniform(0.8, 1.2) + \
                      noise_signal * np.random.uniform(0, 0.1)
        
        newSignal = AudioSignal()
        newSignal.load_audio(wav_with_bg)
        return newSignal
    
    def cut_mix(self, new_sound):
        while(new_sound.shape[0] < self.signal.shape[0]):
            new_sound = np.concatenate((new_sound, new_sound))
        new_sound = new_sound[:self.signal.shape[0]]
        
        lm = random.uniform(0, 1)
        start_point = random.randrange(0, self.signal.shape[0])
        length_cut = int(self.signal.shape[0] * math.sqrt(1 - lm))
        if(start_point + length_cut > self.signal.shape[0]):
            length_cut = self.signal.shape[0] - start_point
        
        constructed_sound = self.signal[0:start_point]
        constructed_sound = np.concatenate((constructed_sound, new_sound[start_point:start_point+length_cut]))
        constructed_sound = np.concatenate((constructed_sound, self.signal[start_point+length_cut:]))
        
        print("Concatenated at {start_point}/{total_length} for {length}".format(start_point = start_point, total_length = self.signal.shape[0], length = length_cut))
        
        return constructed_sound
    
    def timeShift(self,from_ = -56800,to_ = -14800,size = 0.1):
        start_ = int(np.random.uniform(from_, to_))
        #print('time shift: ', start_)
        if start_ >= 0:
            wav_time_shift = np.r_[self.signal[start_:], np.random.uniform(-size, size, start_)]
        else:
            wav_time_shift = np.r_[np.random.uniform(-size, size, -start_), self.signal[:start_]]
        return wav_time_shift
    
    def speedTune(speed1=0.7,speed2=1.3,size = 9000000,tunesize_=0.1):
        speed_rate = np.random.uniform(speed1, speed2)
        wav_speed_tune = cv2.resize(self.signal, (1, int(len(self.signal) * speed_rate))).squeeze()
        #print('speed rate: %.3f' % speed_rate, '(lower is faster)')
        if len(wav_speed_tune) < size:
            pad_len = size - len(wav_speed_tune)
            wav_speed_tune = np.r_[np.random.uniform(-tunesize_, tunesize_, int(pad_len / 2)),
                                   wav_speed_tune,
                                   np.random.uniform(-tunesize_, tunesize_, int(np.ceil(pad_len / 2)))]
        else:
            cut_len = len(wav_speed_tune) - size
            wav_speed_tune = wav_speed_tune[int(cut_len / 2):int(cut_len / 2) + size]
        return wav_speed_tune
    
    def get_spectogram(self):
        n_fft = 2048
        hop_length = 512

        stft = librosa.core.stft(self.signal, hop_length=hop_length, n_fft=n_fft)
        spectogram = np.abs(stft)
        log_spectogram = librosa.amplitude_to_db(spectogram)
        
        return log_spectogram
    
    def get_mfcc(self):
        n_fft = 2048
        hop_length = 512
        mfcc = librosa.feature.mfcc(self.signal, n_fft = n_fft, hop_length = hop_length, n_mfcc=13)
        return mfcc
    
    def export_signal(self):
        sf.write('output.wav', self.signal, hertz)
