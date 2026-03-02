#[derive(serde::Deserialize, Clone)]
pub struct ExportOptions {
    #[serde(alias = "channelIds")]
    pub channel_ids: Vec<String>,
    pub direction: String,
    #[serde(alias = "includeAttachments")]
    pub include_attachments: bool,
    #[serde(alias = "exportFormat")]
    pub format: String,
    #[serde(alias = "outputPath")]
    pub output_path: String,
}

#[derive(serde::Serialize, Clone)]
pub struct ExportProgress {
    pub current: usize,
    pub total: usize,
    pub channel_id: String,
    pub status: String,
    pub processed_count: usize,
}
