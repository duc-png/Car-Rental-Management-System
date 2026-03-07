export default function PasswordSection({ passwordForm, onChange, onSubmit }) {
    return (
        <form className="customer-profile-card customer-password-card" onSubmit={onSubmit}>
            <h3>Đổi mật khẩu</h3>
            <p className="customer-profile-note">Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.</p>
            <div className="customer-profile-grid">
                <label className="customer-profile-full">
                    Mật khẩu hiện tại
                    <input
                        name="oldPassword"
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={onChange}
                        required
                    />
                </label>
                <label>
                    Mật khẩu mới
                    <input
                        name="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={onChange}
                        required
                    />
                </label>
                <label>
                    Xác nhận mật khẩu mới
                    <input
                        name="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={onChange}
                        required
                    />
                </label>
            </div>
            <div className="customer-profile-actions">
                <button type="submit">Cập nhật mật khẩu</button>
            </div>
        </form>
    )
}
