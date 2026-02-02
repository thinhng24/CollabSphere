import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { StatCardProps } from '../types';

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = '#1976d2' }) => {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                color: color,
                opacity: 0.8,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a2332' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatCard;
