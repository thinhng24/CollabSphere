const EmptyState = ({ message = "Không có dữ liệu" }) => {
  return (
    <div style={styles.container}>
      <p>📭 {message}</p>
    </div>
  );
};

const styles = {
  container: {
    padding: 40,
    textAlign: "center",
    color: "#6b7280",
  },
};

export default EmptyState;
