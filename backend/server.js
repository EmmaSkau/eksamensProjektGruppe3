const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    
    // Create the uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Create multer upload instance
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept video files only
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hjv_leadership_app')
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Define Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['participant', 'instructor', 'admin'], 
    default: 'participant' 
  }
}, { timestamps: true });

const gameSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  accessCode: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date }
}, { timestamps: true });

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  points: { type: Number, default: 0 }
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  type: { 
    type: String, 
    enum: ['multiple_choice', 'text', 'video'], 
    required: true 
  },
  options: [{ type: String }], // For multiple choice
  correctAnswer: { type: String }, // For multiple choice
  riskPoints: { type: Number, default: 0 },
  rewardPoints: { type: Number, default: 0 },
  timeLimit: { type: Number, default: 15 }, // in minutes
  category: { type: String, default: 'Ledelse' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const submissionSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  answer: { type: mongoose.Schema.Types.Mixed }, // String for text/choice, object for others
  fileUrl: { type: String }, // For video submissions
  isEvaluated: { type: Boolean, default: false },
  isCorrect: { type: Boolean },
  pointsEarned: { type: Number },
  feedback: { type: String },
  evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  evaluatedAt: { type: Date },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const reflectionSchema = new mongoose.Schema({
  game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { timestamps: true });

// Create models
const User = mongoose.model('User', userSchema);
const Game = mongoose.model('Game', gameSchema);
const Team = mongoose.model('Team', teamSchema);
const Task = mongoose.model('Task', taskSchema);
const Submission = mongoose.model('Submission', submissionSchema);
const Reflection = mongoose.model('Reflection', reflectionSchema);

// Authentication middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Token invalid or expired' });
      }
      
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: 'Authorization required' });
  }
};

// Role-based authorization middleware
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden - insufficient permissions' });
    }
    
    next();
  };
};

// API ROUTES

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: 'participant' // Default role
    });
    
    await newUser.save();
    
    res.status(201).json({ 
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/profile', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Game routes
app.post('/api/games', authenticateJWT, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const { title, description, accessCode, startTime, endTime, isActive } = req.body;
    
    // Check if a game with the same access code already exists
    const existingGame = await Game.findOne({ accessCode });
    
    if (existingGame) {
      return res.status(400).json({ message: 'Game with this access code already exists' });
    }
    
    // Create new game
    const newGame = new Game({
      title,
      description,
      accessCode,
      startTime: startTime || new Date(),
      endTime: endTime || null,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });
    
    await newGame.save();
    
    res.status(201).json(newGame);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/games', authenticateJWT, authorize(['admin']), async (req, res) => {
  try {
    const games = await Game.find()
      .populate('createdBy', 'username')
      .sort('-createdAt');
    
    // Add additional stats
    const gamesWithStats = await Promise.all(games.map(async (game) => {
      const gameObj = game.toObject();
      
      // Count teams for this game
      const teamCount = await Team.countDocuments({ game: game._id });
      
      // Count tasks for this game
      const taskCount = await Task.countDocuments({ game: game._id });
      
      // Count participants
      const teams = await Team.find({ game: game._id });
      const participantCount = teams.reduce((acc, team) => acc + (team.members?.length || 0), 0);
      
      return {
        ...gameObj,
        teamCount,
        taskCount,
        participantCount
      };
    }));
    
    res.json(gamesWithStats);
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/games/instructor', authenticateJWT, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const query = { createdBy: req.user.id };
    
    // If admin, show all games
    if (req.user.role === 'admin') {
      delete query.createdBy;
    }
    
    const games = await Game.find(query)
      .populate('createdBy', 'username')
      .sort('-createdAt');
    
    // Add additional stats
    const gamesWithStats = await Promise.all(games.map(async (game) => {
      const gameObj = game.toObject();
      
      // Count teams for this game
      const teamCount = await Team.countDocuments({ game: game._id });
      
      // Count tasks for this game
      const taskCount = await Task.countDocuments({ game: game._id });
      
      // Count participants
      const teams = await Team.find({ game: game._id });
      const participantCount = teams.reduce((acc, team) => acc + (team.members?.length || 0), 0);
      
      return {
        ...gameObj,
        teamCount,
        taskCount,
        participantCount
      };
    }));
    
    res.json(gamesWithStats);
  } catch (error) {
    console.error('Get instructor games error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/games/:id', authenticateJWT, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('createdBy', 'username');
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/games/:id', authenticateJWT, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check permissions (only creator or admin can update)
    if (game.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this game' });
    }
    
    // Update game
    const { title, description, accessCode, endTime, isActive } = req.body;
    
    // Check if access code is unique if changed
    if (accessCode && accessCode !== game.accessCode) {
      const existingGame = await Game.findOne({ 
        accessCode, 
        _id: { $ne: game._id } 
      });
      
      if (existingGame) {
        return res.status(400).json({ message: 'Game with this access code already exists' });
      }
    }
    
    // Update fields
    game.title = title || game.title;
    game.description = description !== undefined ? description : game.description;
    game.accessCode = accessCode || game.accessCode;
    game.endTime = endTime !== undefined ? endTime : game.endTime;
    game.isActive = isActive !== undefined ? isActive : game.isActive;
    
    await game.save();
    
    res.json(game);
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/games/:id', authenticateJWT, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check permissions (only creator or admin can delete)
    if (game.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this game' });
    }
    
    // Delete all related data
    await Task.deleteMany({ game: game._id });
    
    // Find teams to delete
    const teams = await Team.find({ game: game._id });
    
    // Delete submissions for these teams
    for (const team of teams) {
      await Submission.deleteMany({ team: team._id });
      await Reflection.deleteMany({ team: team._id });
    }
    
    // Delete teams
    await Team.deleteMany({ game: game._id });
    
    // Delete game - Use deleteOne instead of remove
    await Game.deleteOne({ _id: game._id });
    
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/games/join', authenticateJWT, async (req, res) => {
  try {
    const { accessCode } = req.body;
    
    // Find game by access code
    const game = await Game.findOne({ accessCode, isActive: true });
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found or inactive' });
    }
    
    // Check if user is already in a team for this game
    const existingTeam = await Team.findOne({
      game: game._id,
      members: req.user.id
    });
    
    // Return both game and team (if exists)
    res.json({
      game,
      team: existingTeam
    });
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/games/:id/scoreboard', authenticateJWT, async (req, res) => {
  try {
    const gameId = req.params.id;
    
    // Get all teams for this game
    const teams = await Team.find({ game: gameId })
      .populate('members', 'username')
      .sort('-points');
    
    // Get submission counts for each team
    const teamsWithStats = await Promise.all(teams.map(async (team) => {
      const teamObj = team.toObject();
      
      // Count completed tasks
      const completedTasks = await Submission.countDocuments({ 
        team: team._id, 
        isEvaluated: true 
      });
      
      return {
        ...teamObj,
        completedTasks
      };
    }));
    
    res.json(teamsWithStats);
  } catch (error) {
    console.error('Get scoreboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Team routes
app.post('/api/teams', authenticateJWT, async (req, res) => {
  try {
    const { name, game } = req.body;
    
    // Check if game exists
    const gameExists = await Game.findById(game);
    
    if (!gameExists) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Create new team
    const newTeam = new Team({
      name,
      game,
      members: [req.user.id]
    });
    
    await newTeam.save();
    
    // Populate team data
    const populatedTeam = await Team.findById(newTeam._id)
      .populate('members', 'username')
      .populate('game', 'title');
    
    res.status(201).json(populatedTeam);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/teams', authenticateJWT, authorize(['admin']), async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('members', 'username')
      .populate('game', 'title')
      .sort('-createdAt');
    
    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/teams/user', authenticateJWT, async (req, res) => {
  try {
    // Find teams that the user is a member of
    const userTeams = await Team.find({ members: req.user.id })
      .populate('game', 'title accessCode isActive')
      .sort('-createdAt');
    
    res.json(userTeams);
  } catch (error) {
    console.error('Get user teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/teams/:id', authenticateJWT, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'username')
      .populate('game', 'title');
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/teams/:id/join', authenticateJWT, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Check if user is already a member
    if (team.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already a member of this team' });
    }
    
    // Check if user is in another team for the same game
    const existingTeam = await Team.findOne({
      game: team.game,
      members: req.user.id
    });
    
    if (existingTeam) {
      return res.status(400).json({ message: 'Already a member of another team in this game' });
    }
    
    // Add user to team
    team.members.push(req.user.id);
    await team.save();
    
    // Populate team data
    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'username')
      .populate('game', 'title');
    
    res.json(populatedTeam);
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/games/:id/teams', authenticateJWT, async (req, res) => {
  try {
    const teams = await Team.find({ game: req.params.id })
      .populate('members', 'username')
      .sort('-points');
    
    res.json(teams);
  } catch (error) {
    console.error('Get game teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Task routes
app.post('/api/tasks', authenticateJWT, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const {
      title,
      description,
      game,
      type,
      options,
      correctAnswer,
      riskPoints,
      rewardPoints,
      timeLimit,
      category
    } = req.body;
    
    // Check if game exists
    const gameExists = await Game.findById(game);
    
    if (!gameExists) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Create new task
    const newTask = new Task({
      title,
      description,
      game,
      type,
      options: options || [],
      correctAnswer,
      riskPoints: riskPoints || 0,
      rewardPoints: rewardPoints || 0,
      timeLimit: timeLimit || 15,
      category: category || 'Ledelse',
      createdBy: req.user.id
    });
    
    await newTask.save();
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/tasks', authenticateJWT, authorize(['admin']), async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('game', 'title')
      .populate('createdBy', 'username')
      .sort('-createdAt');
    
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/tasks/:id', authenticateJWT, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('game', 'title')
      .populate('createdBy', 'username');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/tasks/:id', authenticateJWT, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check permissions (only creator or admin can update)
    if (task.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    
    // Update task fields
    const {
      title,
      description,
      type,
      options,
      correctAnswer,
      riskPoints,
      rewardPoints,
      timeLimit,
      category
    } = req.body;
    
    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.type = type || task.type;
    task.options = options || task.options;
    task.correctAnswer = correctAnswer !== undefined ? correctAnswer : task.correctAnswer;
    task.riskPoints = riskPoints !== undefined ? riskPoints : task.riskPoints;
    task.rewardPoints = rewardPoints !== undefined ? rewardPoints : task.rewardPoints;
    task.timeLimit = timeLimit !== undefined ? timeLimit : task.timeLimit;
    task.category = category || task.category;
    
    await task.save();
    
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/tasks/:id', authenticateJWT, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check permissions (only creator or admin can delete)
    if (task.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
    
    // Delete submissions for this task
    await Submission.deleteMany({ task: task._id });
    
    // Delete task - Use deleteOne instead of remove
    await Task.deleteOne({ _id: task._id });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/games/:id/tasks', authenticateJWT, async (req, res) => {
  try {
    const tasks = await Task.find({ game: req.params.id })
      .sort('category');
    
    res.json(tasks);
  } catch (error) {
    console.error('Get game tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submission routes
app.post('/api/submissions', authenticateJWT, async (req, res) => {
  try {
    // Handle file upload
    const handleSubmission = async (req, res) => {
      const { task, team, answer } = req.body;
      
      // Check if task and team exist
      const taskData = await Task.findById(task);
      const teamData = await Team.findById(team);
      
      if (!taskData || !teamData) {
        return res.status(404).json({ message: 'Task or team not found' });
      }
      
      // Check if user is a member of the team
      if (!teamData.members.includes(req.user.id)) {
        return res.status(403).json({ message: 'Not a member of this team' });
      }
      
      // Check if team already submitted this task
      const existingSubmission = await Submission.findOne({ task, team });
      
      if (existingSubmission) {
        return res.status(400).json({ message: 'Task already submitted by this team' });
      }
      
      // Create new submission
      const newSubmission = new Submission({
        task,
        team,
        answer,
        submittedAt: new Date()
      });
      
      // If file was uploaded (for video submissions)
      if (req.file) {
        newSubmission.fileUrl = `/uploads/${req.file.filename}`;
      }
      
      // Automatically evaluate multiple choice questions
      if (taskData.type === 'multiple_choice') {
        const isCorrect = answer === taskData.correctAnswer;
        
        newSubmission.isEvaluated = true;
        newSubmission.isCorrect = isCorrect;
        newSubmission.pointsEarned = isCorrect ? taskData.rewardPoints : -taskData.riskPoints;
        
        // Update team points
        teamData.points += newSubmission.pointsEarned;
        await teamData.save();
      }
      
      await newSubmission.save();
      
      // Populate submission data
      const populatedSubmission = await Submission.findById(newSubmission._id)
        .populate('task')
        .populate('team');
      
      res.status(201).json(populatedSubmission);
    };
    
    // Check if this is a multipart request (with file)
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      // Handle file upload
      upload.single('file')(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
        
        // Process submission after file upload
        handleSubmission(req, res);
      });
    } else {
      // Regular submission without file
      handleSubmission(req, res);
    }
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/submissions', authenticateJWT, authorize(['admin']), async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate('task')
      .populate('team')
      .populate('evaluatedBy', 'username')
      .sort('-submittedAt');
    
    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/submissions/pending', authenticateJWT, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    // Find not evaluated submissions
    const query = { isEvaluated: false };
    
    // If instructor, only show submissions for games they created
    if (req.user.role === 'instructor') {
      // Find games created by this instructor
      const instructorGames = await Game.find({ createdBy: req.user.id });
      const gameIds = instructorGames.map(game => game._id);
      
      // Find tasks for these games
      const tasks = await Task.find({ game: { $in: gameIds } });
      const taskIds = tasks.map(task => task._id);
      
      // Filter submissions for these tasks
      query.task = { $in: taskIds };
    }
    
    const pendingSubmissions = await Submission.find(query)
      .populate({
        path: 'task',
        populate: {
          path: 'game',
          select: 'title'
        }
      })
      .populate('team')
      .sort('-submittedAt');
    
    res.json(pendingSubmissions);
  } catch (error) {
    console.error('Get pending submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/submissions/:id', authenticateJWT, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('task')
      .populate('team')
      .populate('evaluatedBy', 'username');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json(submission);
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/submissions/:id', authenticateJWT, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('task')
      .populate('team');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Check permissions (only instructors of this game or admins can evaluate)
    const taskGame = await Task.findById(submission.task._id).populate('game');
    
    if (
      req.user.role === 'instructor' &&
      taskGame.game.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to evaluate this submission' });
    }
    
    // If submission was already evaluated, update team points
    let pointsDifference = 0;
    
    if (submission.isEvaluated) {
      // Calculate point difference
      pointsDifference = (req.body.pointsEarned || 0) - submission.pointsEarned;
    } else {
      // First evaluation
      pointsDifference = req.body.pointsEarned || 0;
    }
    
    // Update submission fields
    submission.isEvaluated = req.body.isEvaluated !== undefined ? req.body.isEvaluated : submission.isEvaluated;
    submission.isCorrect = req.body.isCorrect !== undefined ? req.body.isCorrect : submission.isCorrect;
    submission.pointsEarned = req.body.pointsEarned !== undefined ? req.body.pointsEarned : submission.pointsEarned;
    submission.feedback = req.body.feedback !== undefined ? req.body.feedback : submission.feedback;
    submission.evaluatedBy = req.user.id;
    submission.evaluatedAt = new Date();
    
    await submission.save();
    
    // Update team points if evaluated
    if (submission.isEvaluated && pointsDifference !== 0) {
      const team = await Team.findById(submission.team._id);
      team.points += pointsDifference;
      await team.save();
    }
    
    res.json(submission);
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/teams/:id/submissions', authenticateJWT, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Check if user is a team member, instructor of the game, or admin
    const isTeamMember = team.members.includes(req.user.id);
    const game = await Game.findById(team.game);
    const isGameInstructor = game.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isTeamMember && !isGameInstructor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view team submissions' });
    }
    
    const submissions = await Submission.find({ team: team._id })
      .populate('task')
      .sort('-submittedAt');
    
    res.json(submissions);
  } catch (error) {
    console.error('Get team submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/games/:id/submissions', authenticateJWT, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check permissions (only creator or admin can view)
    if (game.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view game submissions' });
    }
    
    // Get all tasks for this game
    const tasks = await Task.find({ game: game._id });
    const taskIds = tasks.map(task => task._id);
    
    // Find submissions for these tasks
    const submissions = await Submission.find({ task: { $in: taskIds } })
      .populate('task')
      .populate('team')
      .sort('-submittedAt');
    
    res.json(submissions);
  } catch (error) {
    console.error('Get game submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reflection routes
app.post('/api/reflections', authenticateJWT, async (req, res) => {
  try {
    const { game, team, question, answer } = req.body;
    
    // Check if game and team exist
    const gameData = await Game.findById(game);
    const teamData = await Team.findById(team);
    
    if (!gameData || !teamData) {
      return res.status(404).json({ message: 'Game or team not found' });
    }
    
    // Check if user is a member of the team
    if (!teamData.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this team' });
    }
    
    // Check if reflection already exists
    const existingReflection = await Reflection.findOne({
      game,
      team,
      question
    });
    
    if (existingReflection) {
      // Update existing reflection
      existingReflection.answer = answer;
      await existingReflection.save();
      
      return res.json(existingReflection);
    }
    
    // Create new reflection
    const newReflection = new Reflection({
      game,
      team,
      question,
      answer
    });
    
    await newReflection.save();
    
    res.status(201).json(newReflection);
  } catch (error) {
    console.error('Create reflection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/reflections', authenticateJWT, authorize(['admin']), async (req, res) => {
  try {
    const reflections = await Reflection.find()
      .populate('game', 'title')
      .populate('team', 'name')
      .sort('-createdAt');
    
    res.json(reflections);
  } catch (error) {
    console.error('Get reflections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/reflections/:id', authenticateJWT, async (req, res) => {
  try {
    const reflection = await Reflection.findById(req.params.id)
      .populate('game', 'title')
      .populate('team', 'name');
    
    if (!reflection) {
      return res.status(404).json({ message: 'Reflection not found' });
    }
    
    // Check permissions
    const team = await Team.findById(reflection.team);
    const isTeamMember = team.members.includes(req.user.id);
    const game = await Game.findById(reflection.game);
    const isGameInstructor = game.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isTeamMember && !isGameInstructor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this reflection' });
    }
    
    res.json(reflection);
  } catch (error) {
    console.error('Get reflection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/reflections/:id', authenticateJWT, async (req, res) => {
  try {
    const reflection = await Reflection.findById(req.params.id);
    
    if (!reflection) {
      return res.status(404).json({ message: 'Reflection not found' });
    }
    
    // Check if user is a member of the team
    const team = await Team.findById(reflection.team);
    
    if (!team.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to update this reflection' });
    }
    
    // Update reflection
    reflection.answer = req.body.answer || reflection.answer;
    await reflection.save();
    
    res.json(reflection);
  } catch (error) {
    console.error('Update reflection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/teams/:id/reflections', authenticateJWT, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Check permissions
    const isTeamMember = team.members.includes(req.user.id);
    const game = await Game.findById(team.game);
    const isGameInstructor = game.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isTeamMember && !isGameInstructor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view team reflections' });
    }
    
    const reflections = await Reflection.find({ team: team._id })
      .sort('createdAt');
    
    res.json(reflections);
  } catch (error) {
    console.error('Get team reflections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/games/:id/reflections', authenticateJWT, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check permissions (only creator or admin can view)
    if (game.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view game reflections' });
    }
    
    const reflections = await Reflection.find({ game: game._id })
      .populate('team', 'name')
      .sort('team');
    
    res.json(reflections);
  } catch (error) {
    console.error('Get game reflections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
app.get('/api/admin/users', authenticateJWT, authorize(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('username');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/users/:id', authenticateJWT, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the register endpoint in your server.js file and modify it to allow role selection
// Replace your existing registration endpoint with this one:

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user with role (if provided and user is admin) or default to participant
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      // If role is provided and the requester is admin, use that role, otherwise default to participant
      role: role || 'participant'
    });
    
    await newUser.save();
    
    res.status(201).json({ 
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

    // Update user fields
    const { username, email, password, role } = req.body;
    
    // Check if username or email is already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      user.username = username;
    }
    
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email already taken' });
      }
      
      user.email = email;
    }
    
    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    
    // Update role if provided
    if (role) {
      user.role = role;
    }
    
    await user.save();
    
    // Return user without password
    const updatedUser = user.toObject();
    delete updatedUser.password;
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/stats', authenticateJWT, authorize(['admin']), async (req, res) => {
  try {
    // Get system statistics
    const userCount = await User.countDocuments();
    const gameCount = await Game.countDocuments();
    const activeGameCount = await Game.countDocuments({ isActive: true });
    const teamCount = await Team.countDocuments();
    const submissionCount = await Submission.countDocuments();
    const pendingSubmissionCount = await Submission.countDocuments({ isEvaluated: false });
    
    res.json({
      userCount,
      gameCount,
      activeGameCount,
      teamCount,
      submissionCount,
      pendingSubmissionCount
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/export/games/:id', authenticateJWT, authorize(['admin', 'instructor']), async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check permissions (only creator or admin can export)
    if (game.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to export this game' });
    }
    
    // Get all data for this game
    const teams = await Team.find({ game: game._id }).populate('members', 'username');
    const tasks = await Task.find({ game: game._id });
    
    // Get all task IDs
    const taskIds = tasks.map(task => task._id);
    
    // Get submissions for these tasks
    const submissions = await Submission.find({ task: { $in: taskIds } });
    
    // Get reflections for this game
    const reflections = await Reflection.find({ game: game._id });
    
    // Create CSV content
    let csvContent = '';
    
    // Game information
    csvContent += 'Game Information\n';
    csvContent += `Title,${game.title}\n`;
    csvContent += `Access Code,${game.accessCode}\n`;
    csvContent += `Created By,${req.user.username}\n`;
    csvContent += `Start Time,${game.startTime}\n`;
    csvContent += `End Time,${game.endTime || 'N/A'}\n`;
    csvContent += `Active,${game.isActive ? 'Yes' : 'No'}\n\n`;
    
    // Teams
    csvContent += 'Teams\n';
    csvContent += 'Name,Members,Points\n';
    
    teams.forEach(team => {
      const memberNames = team.members.map(member => member.username).join(', ');
      csvContent += `${team.name},${memberNames},${team.points}\n`;
    });
    
    csvContent += '\n';
    
    // Tasks
    csvContent += 'Tasks\n';
    csvContent += 'Title,Type,Category,Risk Points,Reward Points,Time Limit\n';
    
    tasks.forEach(task => {
      csvContent += `${task.title},${task.type},${task.category},${task.riskPoints},${task.rewardPoints},${task.timeLimit}\n`;
    });
    
    csvContent += '\n';
    
    // Submissions
    csvContent += 'Submissions\n';
    csvContent += 'Team,Task,Evaluated,Correct,Points Earned,Submitted At\n';
    
    for (const submission of submissions) {
      const team = teams.find(t => t._id.toString() === submission.team.toString());
      const task = tasks.find(t => t._id.toString() === submission.task.toString());
      
      if (team && task) {
        csvContent += `${team.name},${task.title},${submission.isEvaluated ? 'Yes' : 'No'},${submission.isCorrect ? 'Yes' : 'No'},${submission.pointsEarned || 0},${submission.submittedAt}\n`;
      }
    }
    
    csvContent += '\n';
    
    // Reflections
    csvContent += 'Reflections\n';
    csvContent += 'Team,Question,Answer\n';
    
    for (const reflection of reflections) {
      const team = teams.find(t => t._id.toString() === reflection.team.toString());
      
      if (team) {
        // Escape quotes and newlines in the answer
        const escapedAnswer = reflection.answer.replace(/"/g, '""').replace(/\n/g, ' ');
        csvContent += `${team.name},"${reflection.question}","${escapedAnswer}"\n`;
      }
    }
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${game.title.replace(/\s+/g, '_')}_data.csv"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Export game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Create admin user if none exists
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create admin user
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Admin user created');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Create test data for development
const createTestData = async () => {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  try {
    // Check if test data already exists
    const testGameExists = await Game.findOne({ title: 'Test Game' });
    
    if (testGameExists) {
      return;
    }
    
    console.log('Creating test data...');
    
    // Create instructor user
    const salt = await bcrypt.genSalt(10);
    const instructorPassword = await bcrypt.hash('instructor123', salt);
    
    const instructor = new User({
      username: 'instructor',
      email: 'instructor@example.com',
      password: instructorPassword,
      role: 'instructor'
    });
    
    await instructor.save();
    
    // Create participant users
    const participant1Password = await bcrypt.hash('participant123', salt);
    const participant1 = new User({
      username: 'participant1',
      email: 'participant1@example.com',
      password: participant1Password,
      role: 'participant'
    });
    
    await participant1.save();
    
    const participant2Password = await bcrypt.hash('participant123', salt);
    const participant2 = new User({
      username: 'participant2',
      email: 'participant2@example.com',
      password: participant2Password,
      role: 'participant'
    });
    
    await participant2.save();
    
    // Create test game
    const testGame = new Game({
      title: 'Test Game',
      description: 'This is a test game for development',
      accessCode: 'TEST123',
      createdBy: instructor._id,
      startTime: new Date(),
      isActive: true
    });
    
    await testGame.save();
    
    // Create test teams
    const team1 = new Team({
      name: 'Team Alpha',
      game: testGame._id,
      members: [participant1._id],
      points: 0
    });
    
    await team1.save();
    
    const team2 = new Team({
      name: 'Team Beta',
      game: testGame._id,
      members: [participant2._id],
      points: 0
    });
    
    await team2.save();
    
    // Create test tasks
    const task1 = new Task({
      title: 'Leadership Quiz',
      description: 'What is the most important quality of a leader?',
      game: testGame._id,
      type: 'multiple_choice',
      options: ['Charisma', 'Intelligence', 'Empathy', 'Decisiveness'],
      correctAnswer: 'Empathy',
      riskPoints: 5,
      rewardPoints: 10,
      timeLimit: 5,
      category: 'Ledelse',
      createdBy: instructor._id
    });
    
    await task1.save();
    
    const task2 = new Task({
      title: 'Communication Challenge',
      description: 'Describe a situation where effective communication was crucial to success.',
      game: testGame._id,
      type: 'text',
      riskPoints: 3,
      rewardPoints: 15,
      timeLimit: 10,
      category: 'Kommunikation',
      createdBy: instructor._id
    });
    
    await task2.save();
    
    const task3 = new Task({
      title: 'Decision Making',
      description: 'What is the first step in effective decision making?',
      game: testGame._id,
      type: 'multiple_choice',
      options: ['Identify alternatives', 'Define the problem', 'Evaluate options', 'Make a choice'],
      correctAnswer: 'Define the problem',
      riskPoints: 5,
      rewardPoints: 10,
      timeLimit: 5,
      category: 'Beslutningstagning',
      createdBy: instructor._id
    });
    
    await task3.save();
    
    const task4 = new Task({
      title: 'Conflict Resolution',
      description: 'Explain how you would handle a conflict within your team.',
      game: testGame._id,
      type: 'text',
      riskPoints: 3,
      rewardPoints: 15,
      timeLimit: 10,
      category: 'Konfliktløsning',
      createdBy: instructor._id
    });
    
    await task4.save();
    
    const task5 = new Task({
      title: 'Team Building Quiz',
      description: 'Which of these is NOT a stage in team development according to Tuckman\'s model?',
      game: testGame._id,
      type: 'multiple_choice',
      options: ['Forming', 'Storming', 'Organizing', 'Performing'],
      correctAnswer: 'Organizing',
      riskPoints: 5,
      rewardPoints: 10,
      timeLimit: 5,
      category: 'Teambuilding',
      createdBy: instructor._id
    });
    
    await task5.save();
    
    console.log('Test data created successfully');
  } catch (error) {
    console.error('Error creating test data:', error);
  }
};

// Create admin user and test data
createAdminUser().then(() => {
  createTestData();
});

module.exports = app;