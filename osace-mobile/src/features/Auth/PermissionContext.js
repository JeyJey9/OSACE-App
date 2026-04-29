// src/features/Auth/PermissionContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from './AuthContext';
import { PERMISSIONS } from '../../constants/permissions';

const PermissionContext = createContext({});

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth();
  const [globalPermissions, setGlobalPermissions] = useState([]);
  const [teamEvents, setTeamEvents] = useState([]);

  // Preluăm datele de acces de la server
  const fetchAccess = async () => {
    if (!user) {
      setGlobalPermissions([]);
      setTeamEvents([]);
      return;
    }
    try {
      const res = await api.get('/api/events/my-access');
      setGlobalPermissions(res.data.globalPermissions || []);
      setTeamEvents(res.data.teamEvents || []);
      console.log("[PermissionContext] Permisiuni încărcate cu succes.");
    } catch (error) {
      console.error("[PermissionContext] Eroare la preluarea permisiunilor:", error);
    }
  };

  // Se rulează automat când se schimbă userul (ex: la login sau logout)
  useEffect(() => {
    fetchAccess();
  }, [user]);

  /**
   * Funcția supremă pentru verificarea accesului.
   * @param {string} actionKey - Acțiunea dorită (ex: PERMISSIONS.SCAN_QR)
   * @param {object} event - (Opțional) Obiectul evenimentului pentru acțiuni specifice unui event
   * @returns {boolean} - Are sau nu are voie
   */
  const can = (actionKey, event = null) => {
    if (!user) return false;
    
    // Adminul poate face absolut orice
    if (user.role === 'admin') return true;

    // Verificăm dacă are permisiunea globală "bifată" în panou
    const hasGlobal = globalPermissions.includes(actionKey);

    // Dacă acțiunea este legată de un eveniment specific (Editare, Scanare QR etc.)
    if (event) {
      const isCreator = String(event.created_by) === String(user.id || user.userId);
      const isTeamMember = teamEvents.map(String).includes(String(event.id));

      // Logica "hibridă" discutată: Creatorii și Echipa au din oficiu anumite drepturi pe acel event
      const teamAllowedActions = [PERMISSIONS.SCAN_QR, PERMISSIONS.EDIT_EVENTS, PERMISSIONS.MANAGE_PARTICIPANTS];
      
      if (isCreator) return true; // Creatorul face ce vrea cu evenimentul lui
      if (isTeamMember && teamAllowedActions.includes(actionKey)) return true;
    }

    return hasGlobal;
  };

  return (
    <PermissionContext.Provider value={{ can, refreshPermissions: fetchAccess }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionContext);