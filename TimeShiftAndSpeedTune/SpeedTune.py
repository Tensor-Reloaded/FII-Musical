import cv2
import numpy as np


def speedTune(wav,speed1=0.7,speed2=1.3,size = 9000000,tunesize_=0.1):
    speed_rate = np.random.uniform(speed1, speed2)
    wav_speed_tune = cv2.resize(wav, (1, int(len(wav) * speed_rate))).squeeze()
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