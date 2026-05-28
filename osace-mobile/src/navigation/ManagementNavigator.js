import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Ecrane generale Admin
import AdminMenuScreen from '../features/Admin/screens/AdminMenuScreen';
import StatisticsScreen from '../features/Admin/screens/StatisticsScreen';
import SendNotificationScreen from '../features/Admin/screens/SendNotificationScreen';
import AuditLogScreen from '../features/Admin/screens/AuditLogScreen';

// Sub-domeniu: Events
import ManageEventsScreen from '../features/Admin/events/screens/ManageEventsScreen';
import EventFormScreen from '../features/Admin/events/screens/EventFormScreen';
import EventParticipantsScreen from '../features/Admin/events/screens/EventParticipantsScreen';

// Sub-domeniu: Users
import UserListScreen from '../features/Admin/users/screens/UserListScreen';
import UserDetailsScreen from '../features/Admin/users/screens/UserDetailsScreen';
import HourRequestsScreen from '../features/Admin/users/screens/HourRequestsScreen';
import AssignHoursScreen from '../features/Admin/users/screens/AssignHoursScreen';

// Sub-domeniu: Posts
import PostFormScreen from '../features/Admin/posts/screens/PostFormScreen';

// Sub-domeniu: Badges
import ManageBadgesScreen from '../features/Admin/badges/screens/ManageBadgesScreen';
import BadgeFormScreen from '../features/Admin/badges/screens/BadgeFormScreen';

// Sub-domeniu: Contribuții Speciale
import AssignContributionScreen from '../features/Admin/screens/AssignContributionScreen';
import ContributionRequestsScreen from '../features/Admin/screens/ContributionRequestsScreen';
import ManageContributionsScreen from '../features/Admin/screens/ManageContributionsScreen';
import EditContributionScreen from '../features/Admin/screens/EditContributionScreen';

// Verificare Studenți
import StudentVerificationRequestsScreen from '../features/Admin/screens/StudentVerificationRequestsScreen';
import StudentVerificationScreen from '../features/StudentVerification/screens/StudentVerificationScreen';

// Rapoarte Comentarii
import ReportedCommentsScreen from '../features/Admin/screens/ReportedCommentsScreen';

const Stack = createNativeStackNavigator();

export default function ManagementNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="AdminMenu" 
    >
      {/* --- ECRANE PARTAJATE (Admin & Coordonator) --- */}
      <Stack.Screen name="AdminMenu" component={AdminMenuScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminManageEvents" component={ManageEventsScreen} options={{ title: 'Gestionează Activități' }} />
      <Stack.Screen name="EventForm" component={EventFormScreen} options={{ title: 'Formular Activitate' }} />
      <Stack.Screen name="EventParticipants" component={EventParticipantsScreen} options={({ route }) => ({ title: route.params?.eventTitle || 'Participanți' })} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} options={{ title: 'Statistici' }} />
      
      {/* ▼▼▼ NOU: Adăugăm ecranul pentru Cereri Ore ▼▼▼ */}
      <Stack.Screen name="HourRequests" component={HourRequestsScreen} options={{ title: 'Aprobări Ore' }} />
      <Stack.Screen name="AssignHours" component={AssignHoursScreen} options={{ title: 'Acordare Ore Manuală' }} />
      
      {/* NOU: Ecrane Contribuții Speciale */}
      <Stack.Screen name="AssignContribution" component={AssignContributionScreen} options={{ title: 'Acordare Contribuție' }} />
      <Stack.Screen name="ContributionRequests" component={ContributionRequestsScreen} options={{ title: 'Aprobări Contribuții' }} />
      <Stack.Screen name="ManageContributions" component={ManageContributionsScreen} options={{ title: 'Toate Contribuțiile' }} />
      <Stack.Screen name="EditContribution" component={EditContributionScreen} options={{ title: 'Editare Contribuție' }} />

      {/* --- ECRANE DOAR PENTRU ADMIN (Definite întotdeauna) --- */}
      <Stack.Screen name="AdminUserList" component={UserListScreen} options={{ title: 'Utilizatori' }} />
      <Stack.Screen name="SendNotification" component={SendNotificationScreen} options={{ title: 'Trimite Notificare' }} />
      <Stack.Screen name="PostForm" component={PostFormScreen} options={{ title: 'Postare Nouă' }} />
      <Stack.Screen name="AuditLog" component={AuditLogScreen} options={{ title: 'Jurnal de Audit' }} />
      <Stack.Screen 
        name="ManageBadges" 
        component={ManageBadgesScreen} 
        options={{ title: 'Gestionează Badge-uri' }} 
      />
      <Stack.Screen 
        name="BadgeForm" 
        component={BadgeFormScreen} 
        options={({ route }) => ({ 
          title: route.params?.badge ? 'Editează Badge' : 'Adaugă Badge' 
        })} 
      />

      <Stack.Screen name="UserDetails" component={UserDetailsScreen} options={({ route }) => ({ title: route.params?.userName || 'Detalii Utilizator' })} />

      {/* Verificare Studenți */}
      <Stack.Screen name="StudentVerificationRequests" component={StudentVerificationRequestsScreen} options={{ title: 'Verificări Studenți' }} />
      <Stack.Screen name="StudentVerification" component={StudentVerificationScreen} options={{ headerShown: false }} />

      {/* Rapoarte Comentarii */}
      <Stack.Screen name="ReportedComments" component={ReportedCommentsScreen} options={{ title: 'Comentarii Raportate' }} />
    </Stack.Navigator>
  );
}