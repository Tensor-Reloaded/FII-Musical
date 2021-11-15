import librosa


def to_fast_fourier(initial_melody):
	n = len(initial_melody)
	n_fft = 2048
	padded_melody = librosa.util.fix_length(initial_melody, n + n_fft // 2)
	transformed_melody = librosa.stft(padded_melody, n_fft=n_fft)
	
	return transformed_melody

def from_fast_fourier(fourier, n):
	initial_melody = librosa.istft(fourier, length=n)
	return initial_melody
