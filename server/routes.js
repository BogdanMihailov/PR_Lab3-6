const express = require('express');
const Todo = require('./models/Todo');
const emailService = require('./emailService');
const router = express.Router();

router.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    res.json(todo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/todos', async (req, res) => {
  try {
    if (!req.body.title || req.body.title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const todo = new Todo({
      title: req.body.title,
      description: req.body.description || '',
      completed: req.body.completed || false
    });
    
    const newTodo = await todo.save();
    
    req.io.emit('todoCreated', newTodo);
    
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    if (req.body.title) todo.title = req.body.title;
    if (req.body.description) todo.description = req.body.description;
    if (req.body.completed !== undefined) todo.completed = req.body.completed;

    const updatedTodo = await todo.save();
    
    req.io.emit('todoUpdated', updatedTodo);
    
    res.json(updatedTodo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    await todo.deleteOne();
    
    req.io.emit('todoDeleted', { id: req.params.id });
    
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/email/send-task', async (req, res) => {
  try {
    const { taskId, emailTo } = req.body;
    
    if (!taskId || !emailTo) {
      return res.status(400).json({ message: 'Task ID and recipient email are required' });
    }
    
    const task = await Todo.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const result = await emailService.sendTaskViaEmail(emailTo, task);
    
    if (result.success) {
      res.json({ message: 'Email sent successfully', messageId: result.messageId });
    } else {
      res.status(500).json({ message: 'Failed to send email', error: result.error });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/email/send', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    
    if (!to || !subject) {
      return res.status(400).json({ message: 'Recipient email and subject are required' });
    }
    
    const result = await emailService.sendEmail(to, subject, text || '', html || '');
    
    if (result.success) {
      res.json({ message: 'Email sent successfully', messageId: result.messageId });
    } else {
      res.status(500).json({ message: 'Failed to send email', error: result.error });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/email/imap', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const emails = await emailService.getEmailsIMAP(limit);
    res.json(emails);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch emails via IMAP', error: err.message });
  }
});

router.get('/email/pop3', async (req, res) => {
  try {
    const emails = await emailService.getEmailsPOP3();
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 