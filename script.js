'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');

// Workout classses
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; //[lat, lng]
    this.distance = distance; //in Km
    this.duration = duration; //in min
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  //min/km
  calcPace() {
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcSpeed();
  }

  //km/hr
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

// const run1 = new Running([18.48, 73.94], 5, 40, 70);
// const cyl1 = new Running([18.48, 73.94], 10, 20, 50);
// console.log(run1, cyl1);

// App Architecture
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;

  constructor() {
    this.workouts = [];
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          prompt('Failed to get your location');
        }
      );
    }
  }

  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coordinates = [latitude, longitude];

    this.#map = L.map('map').setView(coordinates, 13);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  // Helper function - to check if number
  isNumber(...values) {
    return values.every(val => Number.isFinite(val));
  }

  isPositive(...values) {
    return values.every(val => val > 0);
  }

  _newWorkout(e) {
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const elevation = +inputElevation.value;
    e.preventDefault();
    // For Running
    if (type === 'running') {
      if (
        !this.isNumber(distance, duration, cadence) ||
        !this.isPositive(distance, duration, cadence)
      )
        return alert('Please input valid positive number');

      const workout = new Running(
        this.#mapEvent.latlng,
        distance,
        duration,
        cadence
      );
      this._renderWorkoutMarker(workout);
    }

    // For Cycling
    if (type === 'cycling') {
      if (
        !this.isNumber(distance, duration, elevation) ||
        !this.isPositive(distance, duration)
      )
        return alert('Please input valid positive number');

      const workout = new Cycling(
        this.#mapEvent.latlng,
        distance,
        duration,
        cadence
      );

      this._renderWorkoutMarker(workout);
    }
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent('Workout')
      .openPopup();

    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }
}

const app = new App();
