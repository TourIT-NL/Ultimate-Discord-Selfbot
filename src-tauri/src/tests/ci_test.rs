use crate::core::error::AppError;

#[test]
fn test_app_error_integrity() {
    let err = AppError::new("Test error message", "test_code");
    assert_eq!(err.user_message, "Test error message");
    assert_eq!(err.error_code, "test_code");
    assert!(err.technical_details.is_none());
}

#[test]
fn test_app_error_conversion() {
    let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
    let app_err = AppError::from(io_err);
    assert_eq!(app_err.error_code, "io_error");
    assert!(
        app_err
            .technical_details
            .unwrap()
            .contains("file not found")
    );
}
