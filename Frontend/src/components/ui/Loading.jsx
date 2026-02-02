const Loading = () => {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p>Đang tải...</p>
    </div>
  );
};

const styles = {
  container: {
    padding: 40,
    textAlign: "center",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #ddd",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 10px",
  },
};

export default Loading;
