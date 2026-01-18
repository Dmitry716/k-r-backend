const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Routes
const monumentsRoutes = require('./routes/monuments');
const monumentsCategoriesRoutes = require('./routes/monuments-categories');
const fencesRoutes = require('./routes/fences');
const accessoriesRoutes = require('./routes/accessories');
const landscapeRoutes = require('./routes/landscape');
const worksRoutes = require('./routes/works');
const blogsRoutes = require('./routes/blogs');
const campaignsRoutes = require('./routes/campaigns');
const epitaphsRoutes = require('./routes/epitaphs');
const filesRoutes = require('./routes/files');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');
const reviewsRoutes = require('./routes/reviews');

// Admin routes
const adminMonumentsRoutes = require('./routes/admin-monuments');
const adminWorksRoutes = require('./routes/admin-works');
const adminFencesRoutes = require('./routes/admin-fences');
const adminAccessoriesRoutes = require('./routes/admin-accessories');
const adminLandscapeRoutes = require('./routes/admin-landscape');
const adminBlogsRoutes = require('./routes/admin-blogs');
const adminCampaignsRoutes = require('./routes/admin-campaigns');
const adminEpitaphsRoutes = require('./routes/admin-epitaphs');
const adminFilesRoutes = require('./routes/admin-files');
const adminPageDescriptionsRoutes = require('./routes/admin-page-descriptions');
const adminPageSeoRoutes = require('./routes/admin-page-seo');
const adminSeoTemplatesRoutes = require('./routes/admin-seo-templates');
const adminSeoFieldsRoutes = require('./routes/admin-seo-fields');
const adminBulkSeoRoutes = require('./routes/admin-bulk-seo');
const seoHierarchyRoutes = require('./routes/seo-hierarchy');

// Public page descriptions
const pageDescriptionsRoutes = require('./routes/page-descriptions');
const pageSeoRoutes = require('./routes/page-seo');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for nginx - specify specific proxy IP instead of true for security
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting with proper proxy configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  trustProxy: false // Let Express handle proxy settings
});
app.use('/api', limiter);

// CORS configuration
const allowedOrigins = process.env.ORIGIN_URLS.split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploaded images
app.use('/uploads', express.static('uploads'));

// Static files from frontend public folder  
const frontendPublicPath = '/var/www/stonerose-frontend/public';

// Serve static files under /api/static/ to work with nginx proxy
app.use('/api/static', express.static(frontendPublicPath, {
  maxAge: '1y',
  etag: true
}));

// API Routes
app.use('/api/monuments', monumentsRoutes);
app.use('/api/monuments-categories', monumentsCategoriesRoutes);
app.use('/api/fences', fencesRoutes);
app.use('/api/accessories', accessoriesRoutes);
app.use('/api/landscape', landscapeRoutes);
app.use('/api/works', worksRoutes);
app.use('/api/blogs', blogsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/epitaphs', epitaphsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/page-descriptions', pageDescriptionsRoutes);
app.use('/api/page-seo', pageSeoRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/auth', authRoutes);

// Admin API Routes
app.use('/api/admin/monuments', adminMonumentsRoutes);
app.use('/api/admin/works', adminWorksRoutes);
app.use('/api/admin/fences', adminFencesRoutes);
app.use('/api/admin/accessories', adminAccessoriesRoutes);
app.use('/api/admin/landscape', adminLandscapeRoutes);
app.use('/api/admin/blogs', adminBlogsRoutes);
app.use('/api/admin/campaigns', adminCampaignsRoutes);
app.use('/api/admin/epitaphs', adminEpitaphsRoutes);
app.use('/api/admin/page-descriptions', adminPageDescriptionsRoutes);
app.use('/api/admin/page-seo', adminPageSeoRoutes);
app.use('/api/admin/seo-templates', adminSeoTemplatesRoutes);
app.use('/api/admin/bulk-seo', adminBulkSeoRoutes); // Массовое обновление SEO
app.use('/api/admin', adminSeoFieldsRoutes); // Маршруты для SEO полей сущностей
app.use('/api/admin', adminFilesRoutes);

// SEO Hierarchy endpoint (для получения применённого SEO с шаблонами)
app.use('/api/seo-hierarchy', seoHierarchyRoutes);

// File upload endpoint (общий для всех)
app.use('/api/upload', uploadRoutes);
app.use('/api', adminFilesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack })
  });
});

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  }
});