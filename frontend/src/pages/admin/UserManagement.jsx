import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService, { api } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement = () => {
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.admin.getUsers();
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Der opstod en fejl ved hentning af brugere');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '3px solid #f3f3f3', 
          borderTop: '3px solid #3498db', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-start',
        marginBottom: '20px'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a365d' }}>Brugeradministration</h1>
        <p style={{ color: '#4a5568' }}>Administrer systemets brugere</p>
      </div>
      
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '10px', 
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 24px', 
          borderBottom: '1px solid #e2e8f0' 
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748' }}>Brugere ({users.length})</h2>
          <Link 
            to="/admin/users/new" 
            style={{ 
              backgroundColor: '#1e40af', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              fontWeight: '500', 
              textDecoration: 'none', 
              display: 'inline-flex', 
              alignItems: 'center' 
            }}
          >
            <span style={{ marginRight: '8px' }}>+</span>
            Opret ny bruger
          </Link>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f7fafc' }}>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
                  Brugernavn
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
                  Email
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
                  Rolle
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
                  Oprettet
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
                  Handling
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ 
                        height: '32px', 
                        width: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: '#ebf4ff', 
                        color: '#2b6cb0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: '500', 
                        marginRight: '12px' 
                      }}>
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#2d3748' }}>{user.username}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#2d3748' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      padding: '2px 8px', 
                      borderRadius: '9999px', 
                      backgroundColor: user.role === 'admin' ? '#fed7d7' : user.role === 'instructor' ? '#bee3f8' : '#c6f6d5',
                      color: user.role === 'admin' ? '#9b2c2c' : user.role === 'instructor' ? '#2b6cb0' : '#276749',
                      border: `1px solid ${user.role === 'admin' ? '#feb2b2' : user.role === 'instructor' ? '#90cdf4' : '#9ae6b4'}`
                    }}>
                      {user.role === 'admin' ? 'Administrator' : ''}
                      {user.role === 'instructor' ? 'Instruktør' : ''}
                      {user.role === 'participant' ? 'Deltager' : ''}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#718096' }}>
                    {new Date(user.createdAt).toLocaleDateString('da-DK')}
                  </td>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <Link 
                      to={`/admin/users/${user._id}`}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        padding: '6px 12px', 
                        backgroundColor: '#ebf8ff', 
                        color: '#2b6cb0', 
                        borderRadius: '6px', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        textDecoration: 'none' 
                      }}
                    >
                      <span style={{ marginRight: '4px' }}>✏️</span>
                      Rediger
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
            <p style={{ color: '#718096', marginBottom: '16px' }}>Ingen brugere fundet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;