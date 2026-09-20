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
    "Fusion":["adobe fusion"], "Akamai":["akamai"]
}

def norm(s): return re.sub(r"\s+"," ",s.lower())
def has(text, aliases): return any(x in text for x in aliases)

def analyze_resume(resume, jd):
    r, j = norm(resume), norm(jd)
    found = [k for k,a in SKILLS.items() if has(r,a) and has(j,a)]
    missing = [k for k,a in SKILLS.items() if has(j,a) and not has(r,a)]
    related = []
    if "CloudFormation" in missing and has(r, SKILLS["Terraform"]):
        related.append("CloudFormation → Terraform (related IaC)")
    total = len(found)+len(missing)
    keyword_score = round(100*len(found)/total) if total else 0
    try:
        m=TfidfVectorizer(stop_words="english",ngram_range=(1,2)).fit_transform([resume,jd])
        semantic=round(float(cosine_similarity(m[0:1],m[1:2])[0][0])*100)
    except ValueError:
        semantic=0
    sections=sum(x in r for x in ["summary","experience","skills","education"])
    structure=round(sections/4*100)
    metrics=min(100,len(re.findall(r"\b\d+%|\b\d+\+",resume))*20)
    score=round(keyword_score*.55+semantic*.25+structure*.10+metrics*.10)
    return {"score":score,"breakdown":{"keywords":keyword_score,"semantic":semantic,"structure":structure,"achievements":metrics},"matched":found,"related":related,"missing":missing,"note":"ATS-style simulation only; not an employer ATS score."}
