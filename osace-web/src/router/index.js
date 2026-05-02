import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardLayout from '../views/DashboardLayout.vue';
import NewsFeedView from '../views/NewsFeedView.vue';
import ProfileView from '../views/ProfileView.vue';
import LeaderboardView from '../views/LeaderboardView.vue';
import AdminView from '../views/AdminView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'feed',
          component: NewsFeedView
        },
        {
          path: 'leaderboard',
          name: 'leaderboard',
          component: LeaderboardView
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView
        },
        {
          path: 'admin',
          name: 'admin',
          component: AdminView,
          meta: { requiresAdmin: true }
        }
      ]
    }
  ]
});

// Navigation Guards
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('userToken');
  const userStr = localStorage.getItem('userData');
  let user = null;
  
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {}
  }

  if (to.meta.requiresAuth && !token) {
    next({ name: 'login' });
  } else if (to.meta.requiresAdmin && (!user || (user.role !== 'admin' && user.role !== 'coordonator'))) {
    next({ name: 'feed' }); // Redirect back if not admin/coord
  } else if (to.name === 'login' && token) {
    next({ name: 'feed' });
  } else {
    next();
  }
});

export default router;
