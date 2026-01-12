// src/components/ScheduleMeeting.js
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/meetings'; // Replace with your backend API URL

const ScheduleMeeting = () => {
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, { title, dateTime, description });
      alert('Meeting scheduled successfully!');
    } catch (error) {
      alert('Error scheduling meeting: ' + error.message);
    }
  };

  return (
    <div>
      <h2>Schedule Meeting</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Title:
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Date & Time:
          <DatePicker selected={dateTime} onChange={(date) => setDateTime(date)} showTimeSelect dateFormat="Pp" />
        </label>
        <label>
          Description:
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button type="submit">Schedule</button>
      </form>
    </div>
  );
};

export default ScheduleMeeting;