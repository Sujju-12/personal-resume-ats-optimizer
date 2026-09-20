import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

SKILLS = {
    "AWS":["aws","amazon web services"], "Kubernetes":["kubernetes","k8s","eks"],
    "Terraform":["terraform","infrastructure as code","iac"], "Jenkins":["jenkins"],
    "GitHub Actions":["github actions"], "Docker":["docker","containerization"],
    "Helm":["helm"], "Python":["python"], "SQL":["sql"], "Prometheus":["prometheus"],
    "Grafana":["grafana"], "CloudWatch":["cloudwatch"], "IAM":["iam"],
    "Lambda":["lambda","serverless"], "API Gateway":["api gateway"],
    "Webhooks":["webhook","webhooks"], "Event-driven":["event-driven","event driven"],
    "Microservices":["microservices","microservice"], "Observability":["observability"],
    "CloudFormation":["cloudformation","cloud formation"], "AEM":["aem","adobe experience manager"],
    "Adobe Workfront":["adobe workfront"], "Adobe I/O":["adobe i/o","adobe io"],
    "Fusion":["adobe fusion"], "Akamai":["akamai"], "Ansible":["ansible"],
    "ArgoCD":["argocd","argo cd"], "Istio":["istio"], "Maven":["maven"],
    "SonarQube":["sonarqube","sonar"], "Linux":["linux","ubuntu","amazon linux"],
    "Git":["git","github"], "Route 53":["route 53","route53"], "ALB":["alb","application load balancer"],
    "RDS":["rds"], "S3":["s3"], "ECR":["ecr"], "VPC":["vpc"], "NAT Gateway":["nat gateway"],
    "CloudFront":["cloudfront"], "API Security":["jwt","oauth","rate limiting"],
}

SECTION_ALIASES = {
    "summary":["summary","profile","professional summary"],
    "experience":["experience","work experience","professional experience"],
    "skills":["skills","technical skills","technologies"],
    "education":["education","academic"],
    "projects":["projects","personal projects","key projects"],
    "certifications":["certifications","certificates"],
}

REQUIRED_MARKERS = [
    "required", "must have", "must-have", "you will need", "need to have",
    "essential", "minimum qualifications", "basic qualifications"
]
PREFERRED_MARKERS = [
    "preferred", "nice to have", "nice-to-have", "plus", "bonus", "desired",
    "preferred qualifications"
]

def norm(s):
    return re.sub(r"\s+", " ", s.lower()).strip()

def has(text, aliases):
    return any(re.search(r"(?<![a-z0-9])" + re.escape(x) + r"(?![a-z0-9])", text) for x in aliases)

def extract_years(text):
    values = [float(x) for x in re.findall(r"(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)", text.lower())]
    return max(values, default=0)

def split_sentences(text):
    return [s.strip(" •-\t") for s in re.split(r"(?<=[.!?])\s+|\n+", text) if len(s.strip()) >= 20]

def section_context(sentence, jd):
    lower = sentence.lower()
    if any(marker in lower for marker in PREFERRED_MARKERS):
        return "preferred"
    if any(marker in lower for marker in REQUIRED_MARKERS):
        return "required"
    return "general"

def classify_jd_skills(jd):
    sentences = split_sentences(jd)
    required, preferred, general = [], [], []
    for name, aliases in SKILLS.items():
        if not has(jd, aliases):
            continue
        contexts = [section_context(s, jd) for s in sentences if has(norm(s), aliases)]
        if "required" in contexts:
            required.append(name)
        elif "preferred" in contexts:
            preferred.append(name)
        else:
            general.append(name)
    return required, preferred, general

def extract_role_titles(jd):
    terms = [
        "devops engineer","site reliability engineer","sre","cloud engineer",
        "platform engineer","software engineer","mlops engineer","agentops engineer",
        "devsecops engineer","cloud support engineer"
    ]
    return [term for term in terms if term in jd]

def extract_responsibilities(jd):
    lines = [line.strip(" •-*\t") for line in jd.splitlines() if line.strip()]
    verbs = re.compile(r"^(build|design|develop|deploy|manage|maintain|automate|monitor|implement|support|troubleshoot|create|lead|own|configure|integrate|optimize|improve|collaborate)\b", re.I)
    return [line for line in lines if verbs.search(line)][:12]

def analyze_resume(resume, jd):
    r, j = norm(resume), norm(jd)
    required_skills, preferred_skills, general_skills = classify_jd_skills(jd)

    matched = [k for k,a in SKILLS.items() if has(r,a) and has(j,a)]
    missing = [k for k,a in SKILLS.items() if has(j,a) and not has(r,a)]

    related = []
    if "CloudFormation" in missing and has(r, SKILLS["Terraform"]):
        related.append("CloudFormation → Terraform (related IaC)")
    if "Kubernetes" in missing and has(r, SKILLS["Docker"]):
        related.append("Kubernetes → Docker (related container skill)")

    total = len(matched) + len(missing)
    keyword_score = round(100 * len(matched) / total) if total else 0

    try:
        matrix = TfidfVectorizer(stop_words="english", ngram_range=(1, 2)).fit_transform([resume, jd])
        semantic = round(float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0]) * 100)
    except ValueError:
        semantic = 0

    present_sections = [name for name, aliases in SECTION_ALIASES.items() if any(a in r for a in aliases)]
    structure = round(100 * len(present_sections) / len(SECTION_ALIASES))

    achievement_patterns = [
        r"\b\d+(?:\.\d+)?%",
        r"\b\d+(?:\.\d+)?\+",
        r"\b(?:reduced|increased|improved|saved|accelerated|cut|grew|automated|decreased)\b",
    ]
    achievement_hits = sum(len(re.findall(p, r)) for p in achievement_patterns)
    achievements = min(100, achievement_hits * 15)

    resume_years = extract_years(r)
    jd_years_match = re.search(r"(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\s+(?:of\s+)?experience", j)
    jd_years = float(jd_years_match.group(1)) if jd_years_match else 0
    experience = 100 if not jd_years else min(100, round((resume_years / jd_years) * 100)) if resume_years else 0

    title_terms = extract_role_titles(j)
    title_alignment = 100 if not title_terms else round(100 * sum(t in r for t in title_terms) / len(title_terms))

    required_matched = [k for k in required_skills if has(r, SKILLS[k])]
    required_missing = [k for k in required_skills if not has(r, SKILLS[k])]
    preferred_matched = [k for k in preferred_skills if has(r, SKILLS[k])]
    preferred_missing = [k for k in preferred_skills if not has(r, SKILLS[k])]

    score = round(
        keyword_score * 0.45
        + semantic * 0.20
        + structure * 0.10
        + achievements * 0.10
        + experience * 0.10
        + title_alignment * 0.05
    )

    return {
        "score": score,
        "breakdown": {
            "keywords": keyword_score,
            "semantic": semantic,
            "structure": structure,
            "achievements": achievements,
            "experience": experience,
            "title_alignment": title_alignment,
        },
        "matched": matched,
        "related": related,
        "missing": missing,
        "sections_found": present_sections,
        "jd_intelligence": {
            "required_skills": required_skills,
            "preferred_skills": preferred_skills,
            "general_skills": general_skills,
            "required_matched": required_matched,
            "required_missing": required_missing,
            "preferred_matched": preferred_matched,
            "preferred_missing": preferred_missing,
            "role_titles": title_terms,
            "responsibilities": extract_responsibilities(jd),
        },
        "jd_required_years": jd_years,
        "resume_years_detected": resume_years,
        "note": "ATS-style simulation only; not an employer ATS score.",
    }
