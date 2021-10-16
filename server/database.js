const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  let user = null;

  const query = `SELECT id, name, email, password FROM users WHERE email = $1`;

  const value = [email];

  return pool
    .query(query, value)
    .then(res => {
      user = res.rows[0];
      console.log(res.rows);
      return user;
    })
    .catch(err => {
      console.log(err.message);
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  let user = null;

  const query = `SELECT id, name, email, password FROM users WHERE id = $1`;

  const value = [id];

  return pool
    .query(query, value)
    .then(res => {
      user = res.rows[0];
      return user;
    })
    .catch(err => {
      console.log(err.message);
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {

  const query = `INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3) RETURNING *`;

  const values = [user.name, user.email, user.password];

  return pool
    .query(query, values)
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    })
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {

  const query = `SELECT * FROM properties
    JOIN reservations ON reservations.property_id = properties.id
    JOIN users ON users.id = reservations.guest_id
    WHERE users.id = $1
    LIMIT $2`;

  const value = [guest_id, limit];

  return pool
    .query(query, value)
    .then(res => {
      console.log(res.rows)
      return res.rows;
    })
    .catch(err => {
      console.log(err);
    });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];

  // 2
  let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryString += `AND cost_per_night >= $${queryParams.length} `;
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `AND cost_per_night <= $${queryParams.length} `;
  }

  // 4

  if (options.minimum_rating) {
    queryParams.push(parseInt(options.minimum_rating));
  }

  queryString += `
    GROUP BY properties.id
    ${options.minimum_rating ? `HAVING avg(property_reviews.rating) > $${queryParams.length}` : ''}
    ORDER BY cost_per_night
  `;

  queryParams.push(limit);
  queryString += `LIMIT $${queryParams.length};`;

  // 5
  // console.log(queryString, queryParams);

  // 6
  return pool
  .query(queryString, queryParams)
  .then((res) => {
    // console.log(res.rows);
    return res.rows
  })
  .catch(err => console.log(err));
};

exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const values = [...property];

  const query = `INSERT INTO properties (
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *`;

  return pool
    .query(query, values)
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.addProperty = addProperty;


const addReservation = function(reservation) {

  // console.log(reservation);
  console.log(reservation)

  /*
   * Adds a reservation from a specific user to the database
   */
  return pool.query(`
    INSERT INTO reservations (start_date, end_date, property_id, guest_id)
    VALUES ($1, $2, $3, $4) RETURNING *;
  `, [reservation.start_date, reservation.end_date, reservation.property_id, reservation.guest_id])
  .then(res => res.rows[0])
  .catch(err => console.log(err.message));
}

exports.addReservation = addReservation;