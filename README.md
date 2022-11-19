# Sons de ta ville

## About the project

Sons de ta ville is a school project carried out by 4 media engineering students from [HEIG-VD](https://heig-vd.ch) in the context of the [Web-Oriented Architecture class](https://github.com/MediaComem/comem-archioweb).

We coded an API from scratch using [NodeJS](https://nodejs.org/en/), [Express](https://expressjs.com/en) and [Mongoose](https://mongoosejs.com/). The API will be used as a backend for a mobile app that will be centered around posting sounds along with the location they were recorded at. Users will be able to create an account and post sounds. They’ll be able to discover other users’ sounds and add comments to them.

## The API

We deployed the API on [Render](https://render.com/) and it is available at the following address: [https://sons-de-ta-ville.onrender.com](https://sons-de-ta-ville.onrender.com/). You can find all the endpoints and their methods in the [API documentation](https://sons-de-ta-ville.onrender.com/docs).

## Installation

If you wish to run the API on your own server, you can clone this repo. You will need to install MongoDB and create a .env file to use your own JWT secret, database URL and port.