import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TodoList from './components/TodoList';
import TodoDetail from './components/TodoDetail';
import './App.css';
import { FaClipboardCheck } from 'react-icons/fa';

function App() {
  return (
    <div className="App">
      <nav className="navbar navbar-dark">
        <div className="container">
          <span className="navbar-brand mb-0 h1">
            <FaClipboardCheck className="icon" /> TaskFlow Manager
          </span>
        </div>
      </nav>
      <div className="container py-2">
        <Routes>
          <Route path="/" element={<TodoList />} />
          <Route path="/todo/:id" element={<TodoDetail />} />
        </Routes>
      </div>
    </div>
  );
}

export default App; 