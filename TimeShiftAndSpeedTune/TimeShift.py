import numpy as np


def timeShift(wav,from_ = -56800,to_ = -14800,size = 0.1):
    start_ = int(np.random.uniform(from_, to_))
    #print('time shift: ', start_)
    if start_ >= 0:
        wav_time_shift = np.r_[wav[start_:], np.random.uniform(-size, size, start_)]
    else:
        wav_time_shift = np.r_[np.random.uniform(-size, size, -start_), wav[:start_]]
    return wav_time_shift