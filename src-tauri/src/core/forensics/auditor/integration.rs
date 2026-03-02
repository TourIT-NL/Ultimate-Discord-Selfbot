use serde_json::Value;

#[derive(serde::Serialize)]
pub struct RiskReport {
    pub risk_score: u32,
    pub warnings: Vec<String>,
}

pub struct IntegrationAuditor;

impl IntegrationAuditor {
    pub fn audit_app(app_json: &Value) -> RiskReport {
        let mut warnings = Vec::new();
        let mut score = 0;

        if let Some(scopes) = app_json["scopes"].as_array() {
            for scope in scopes {
                if let Some(s) = scope.as_str() {
                    match s {
                        "messages.read" => {
                            score += 40;
                            warnings.push("Can read your messages".into());
                        }
                        "guilds.join" => {
                            score += 20;
                            warnings.push("Can join servers for you".into());
                        }
                        "rpc" => {
                            score += 30;
                            warnings.push("Full RPC access".into());
                        }
                        _ => {}
                    }
                }
            }
        }

        RiskReport {
            risk_score: score,
            warnings,
        }
    }
}
