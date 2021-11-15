import tensorflow as tf
from tensorflow import keras
from keras import layers
import matplotlib.pyplot as plt
import numpy as np
import soundfile as sf
import librosa
from transformations import to_fast_fourier, from_fast_fourier
from playsound import playsound
from AudioProc import AudioSignal

class VAE(keras.Model):
    def __init__(self, encoder, decoder, **kwargs):
        super(VAE, self).__init__(**kwargs)
        self.encoder = encoder
        self.decoder = decoder
        self.reconstruction_loss_tracker = keras.metrics.Mean(
            name="reconstruction_loss"
        )

    @property
    def metrics(self):
        return [
            self.reconstruction_loss_tracker,
        ]
    def call(self, data):
    	return self.decoder(self.encoder(data))

    def train_step(self, data):
        with tf.GradientTape() as tape:
            z = self.encoder(data)
            reconstruction = self.decoder(z)
            reconstruction = tf.reshape(reconstruction, data.shape)
            reconstruction_loss = tf.reduce_mean(
                tf.reduce_mean(
                    keras.losses.binary_crossentropy(data, reconstruction)
                )
            )

        grads = tape.gradient(reconstruction_loss, self.trainable_weights)
        self.optimizer.apply_gradients(zip(grads, self.trainable_weights))
        self.reconstruction_loss_tracker.update_state(reconstruction_loss)

        return {
            "reconstruction_loss": self.reconstruction_loss_tracker.result()
        }


def build_model(input_shape, latent_dim=100):

	encoder_inputs = keras.Input(shape=input_shape)
	x = layers.Conv1D(64, 1, activation="relu", strides=1, padding="same")(encoder_inputs)
	x = layers.Conv1D(128, 1, activation="relu", strides=1, padding="same")(x)
	x = layers.Conv1D(256, 1, activation="relu", strides=1, padding="same")(x)
	x = layers.Conv1D(512, 1, activation="relu", strides=1, padding="same")(x)
	x = layers.Flatten()(x)
	output_encoder = layers.Dense(latent_dim, activation="relu")(x)
	encoder = keras.Model(encoder_inputs, output_encoder, name="encoder")
	encoder.summary()


	latent_inputs = keras.Input(shape=(latent_dim, ))
	x = layers.Reshape((1, latent_dim))(latent_inputs)
	x = layers.Conv1DTranspose(512, 1, activation="relu", strides=1, padding="same")(x)
	x = layers.Conv1DTranspose(256, 1, activation="relu", strides=1, padding="same")(x)
	x = layers.Conv1DTranspose(128, 1, activation="relu", strides=1, padding="same")(x)
	x = layers.Conv1DTranspose(64, 1, activation="relu", strides=1, padding="same")(x)
	decoder_outputs = layers.Conv1DTranspose(input_shape[1], 1, activation="sigmoid", padding="same")(x)
	decoder = keras.Model(latent_inputs, decoder_outputs, name="decoder")
	decoder.summary()

	vae = VAE(encoder, decoder)

	return vae



def main():
	filename = 'D:\\musicnet\\musicnet\\train_data\\1727.wav'
	
	audio_signal = AudioSignal(3000)
	audio_signal.load_audio(filename)
	
	audio_signal.plot_amplitude()



	# initial_melody, soundrate = librosa.load(filename, sr=3000, duration=5)
	# initial_melody = initial_melody.reshape(1, initial_melody.shape[0])
	# # n_initial_melody = len(initial_melody)
	# # fourier_initial_melody = to_fast_fourier(initial_melody)

	# noise = np.random.normal(0, .1, initial_melody.shape)
	# # fourier_noisy_melody = to_fast_fourier(noise)
	# # n_noisy_melody = len(noise)
	# print(initial_melody.shape)
	# data = np.array([initial_melody for i in range(10)])
	
	# vae = build_model(initial_melody.shape, latent_dim=10)
	# vae.compile(optimizer=keras.optimizers.Adam())
	# vae.fit(data, epochs=100, batch_size=5)

	# prediction = vae.predict(np.array([noise]))
	# # print(fourier_initial_melody)
	# print(prediction[0][0].shape)
	# # pr = from_fast_fourier(prediction[0], n_noisy_melody)


	# sf.write('file.wav', prediction[0][0], soundrate)


if __name__ == '__main__':
	main()
