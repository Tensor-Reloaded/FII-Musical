import time
import cv2
import librosa
import matplotlib.pyplot as plt
import numpy as np
import TimeShift
import SpeedTune


def get_spectrogram(wav):
    D = librosa.stft(wav, n_fft=480, hop_length=160,
                     win_length=480, window='hamming')
    spect, phase = librosa.magphase(D)
    return spect

if __name__ == '__main__':
    print('starting')
    EPS = 1e-8
    file_path = './1759.wav'
    wav, sr = librosa.load(file_path, sr=None)
    print(wav.shape, wav.max(), wav.min())

    #Plot set up
    fig = plt.figure(figsize=(8, 8))
    rows = 2
    columns = 2

    log_spect = np.log(get_spectrogram(wav))
    print('spectrogram shape:', log_spect.shape)
    fig.add_subplot(rows, columns, 1)
    plt.imshow(log_spect, aspect='auto', origin='lower', )
    plt.title('spectrogram of origin audio')

    first = time.time()
    #Time shift
    wav_time_shift = TimeShift.timeShift(wav)
    #Time shift results
    second = time.time()
    print('Time shift duration: ', second-first) #0.02
    log_spect = np.log(get_spectrogram(wav_time_shift) + EPS)
    print('spectrogram shape:', log_spect.shape)
    fig.add_subplot(rows, columns, 2)
    plt.imshow(log_spect, aspect='auto', origin='lower', )
    plt.title('spectrogram of time shifted audio')

    #speed tunning
    first = time.time ()
    wav_speed_tune = SpeedTune.speedTune(wav)
    print('wav length: ', wav_speed_tune.shape[0])
    #ipd.Audio(wav_speed_tune, rate=sr)
    second = time.time ()
    print ('speed tune time: ', second - first)  #0.25
    log_spect = np.log(get_spectrogram(wav_speed_tune) + EPS)
    print('spectrogram shape:', log_spect.shape)
    fig.add_subplot(rows, columns, 3)
    plt.imshow(log_spect, aspect='auto', origin='lower', )
    plt.title('spectrogram of speed tuned audio')
    plt.show()