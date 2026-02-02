const Footer = () => {
  return (
    <footer style={styles.footer}>
      © {new Date().getFullYear()} Project Management System
    </footer>
  );
};

const styles = {
  footer: {
    padding: 12,
    textAlign: "center",
    background: "#e5e7eb",
    marginTop: "auto",
  },
};

export default Footer;
