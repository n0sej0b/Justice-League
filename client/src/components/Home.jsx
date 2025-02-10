// src/components/Home.jsx
import React from 'react';
import './Home.css'; // You'll need to create this CSS file

const Home = () => {
  return (
    <div className="home-container">
      <h1>Welcome to Justice League Reviews!</h1>
      
      <div className="text-segment">
        <p>
          Join us in exploring the adventures and missions of Earth's mightiest heroes.
          The Justice League represents the pinnacle of heroism and justice in the DC Universe.
        </p>
      </div>

      <div className="image-segment">
        <img 
          src="https://static0.cbrimages.com/wordpress/wp-content/uploads/2020/09/Justice-League-Cropped.jpg" 
          alt="Justice League Heroes"
          className="hero-image"
        />
      </div>

      <div className="text-segment">
        <p>
          We believe in making our Heroes better by giving you a direct line to them. You'll be able to make direct requests and reviews on how 
          that hero did helping you.<br></br> We also believe in giving formally known "bad guys" a million chances to change thier ways so you might even
          see a few faces on the right side for once.<br></br> We hope you enjoy your time here and that you'll be able to help us make the world a better place.
        </p>
      </div>
    </div>
  );
};

export default Home;
