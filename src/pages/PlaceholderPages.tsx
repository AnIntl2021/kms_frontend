import Layout from '../components/Layout';

const PlaceholderPage = ({ title }: { title: string }) => (
  <Layout title={title}>
    <div style={{ 
      background: 'white', 
      padding: '3rem', 
      borderRadius: '12px', 
      boxShadow: 'var(--shadow-sm)',
      textAlign: 'center'
    }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{title} Module</h2>
      <p style={{ color: 'var(--gray-500)' }}>This module is currently being optimized for the fresh 'n' Fast portal.</p>
    </div>
  </Layout>
);

export const AdministrationPage = () => <PlaceholderPage title="Administration" />;
