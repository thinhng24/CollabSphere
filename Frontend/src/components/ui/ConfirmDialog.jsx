const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <h4>{title}</h4>
        <p>{message}</p>
        <div style={{ marginTop: 16 }}>
          <button onClick={onConfirm} style={styles.confirm}>
            Xác nhận
          </button>
          <button onClick={onCancel} style={styles.cancel}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    background: "#fff",
    padding: 20,
    width: 300,
    borderRadius: 6,
  },
  confirm: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    marginRight: 8,
  },
  cancel: {
    background: "#e5e7eb",
    border: "none",
    padding: "6px 12px",
  },
};

export default ConfirmDialog;
