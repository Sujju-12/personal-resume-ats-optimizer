from app.services.scorer import analyze_resume, classify_jd_skills, extract_years

def test_classifies_required_and_preferred_skills():
    jd = """Required: 3+ years experience with AWS, Kubernetes and Terraform.
Preferred: Prometheus and Grafana."""
    required, preferred, general = classify_jd_skills(jd)
    assert "AWS" in required
    assert "Kubernetes" in required
    assert "Terraform" in required
    assert "Prometheus" in preferred
    assert "Grafana" in preferred
    assert general == []

def test_extract_years_supports_plus_and_decimal():
    assert extract_years("3+ years DevOps and 2.5 years cloud") == 3.0

def test_score_returns_actionable_plan():
    resume = """Professional Summary
DevOps Engineer with 3+ years experience.
Skills
AWS, Docker, Terraform
Experience
Automated deployments and reduced deployment time by 40%."""
    jd = """Required: AWS, Kubernetes, Terraform.
Preferred: Prometheus.
DevOps Engineer with 3+ years experience."""
    result = analyze_resume(resume, jd)
    assert 0 <= result["score"] <= 100
    assert "Kubernetes" in result["missing"]
    assert result["optimization_plan"]
    assert any(item["area"] == "required_skills" for item in result["optimization_plan"])
