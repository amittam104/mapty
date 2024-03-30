'use strict';



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

  _workoutDescription () {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.descirption = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._workoutDescription()
  }

  //min/km
  calcPace() {
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._workoutDescription()
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
  #workouts = [];
  #zoomlLevel = 13

  constructor() {
  
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))
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

    this.#map = L.map('map').setView(coordinates, this.#zoomlLevel);

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

  // prettier-ignore
  _hideForm() {
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    form.style.display = 'none'
    form.classList.add('hidden');
    setTimeout(() => form.style.display = 'grid', 1000) 
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
    let workout
    
    e.preventDefault();
    // For Running
    if (type === 'running') {
      if (
        !this.isNumber(distance, duration, cadence) ||
        !this.isPositive(distance, duration, cadence)
      )
        return alert('Please input valid positive number');

      workout = new Running(
        this.#mapEvent.latlng,
        distance,
        duration,
        cadence
      );
    
    }

    // For Cycling
    if (type === 'cycling') {
      if (
        !this.isNumber(distance, duration, elevation) ||
        !this.isPositive(distance, duration)
      )
        return alert('Please input valid positive number');

      workout = new Cycling(
        this.#mapEvent.latlng,
        distance,
        duration,
        cadence
      );      
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on sidebar
    this._renderWorkout(workout)
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
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.descirption}`)
      .openPopup();

      this._hideForm();
  }

  _renderWorkout(workout) {
    let html = 
    `<li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.descirption}</h2>
      <div class="workout__details">
        <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `

    if(workout.type === 'running') {
      html += 
        `<div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `
    }

    if(workout.type === 'cycling'){
      html +=
        `<div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `
    }

    form.insertAdjacentHTML('afterend', html)
  }

  _moveToPopup(e){
    const workoutEl = e.target.closest('.workout')

    if(!workoutEl) return;

    const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id)

    this.#map.setView(workout.coords, this.#zoomlLevel, {
      Animation: true,
      pan: {
        duration: 1
      }
    })
  }
}

const app = new App();
