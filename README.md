
[![Docker build](https://github.com/kromitgmbh/titra/actions/workflows/push.yml/badge.svg)](https://github.com/kromitgmbh/titra/actions/workflows/push.yml) ![Docker Pulls](https://img.shields.io/docker/pulls/kromit/titra.svg) ![Latest Release](https://img.shields.io/github/v/release/kromitgmbh/titra.svg)

# ![titra logo](public/favicons/favicon-32x32.png) Exadel Internship project KroKusLab

### Content:

[1. Integration Github with GitLab](#github_integration)

[2. Create Microsoft Azure VM](#vm)

[3. Install Docker](#docker)

[4. Install and setup gitlab-runner](#runners)

[5. Install and setup kubectl](#kubectl)

[6. Install and setup Google Cloud SDK](#gcloud)

[7. Install and setup Helm](#helm)

[8. CI/CD](#cicd)

[9. Kubernetes as an orchestration](#k8s)

[10. Alerting, logging and monitoring](#alarm)


---
<a name="github_integration"></a><!-- 1 -->
### Made a branch from the official repository  [Titra](https://github.com/kromitgmbh/titra) and configured web hook for integration with [GitLab repository of our project ](https://gitlab.com/shagov.alexei/titra-project).

![fork](./images/1.0.0.jpg )

### Create personal access token
![fork](./images/1.0.1.jpg )

In GitLab, create a project, import and setup
![fork](./images/1.0.1.1.jpg )
![fork](./images/1.0.1.2.jpg )
![webhook](./images/1.0.2.jpg )
![webhook](./images/1.0.3.jpg )
![webhook](./images/1.0.4.jpg )
![webhook](./images/1.0.5.jpg )

---
<a name="vm"></a> <!-- 2 -->
## Created for the build, testing and deployment stages VM in Microsoft Azure
### 1. Manual (use [user_data.sh](https://gitlab.com/shagov.alexei/titra-project/-/blob/master/user_data.sh))
![vm](./images/2.0.0.jpg )

### 2. Using Terraform  ( use [main.tf](https://gitlab.com/shagov.alexei/titra-project/-/blob/master/main.tf) )

```sh
$env:ARM_SUBSCRIPTION_ID="xxx"
$env:ARM_TENANT_ID="xxx"
$env:ARM_CLIENT_ID="xxx"
$env:ARM_CLIENT_SECRET="xxx"

echo $env:ARM_SUBSCRIPTION_ID
echo $env:ARM_TENANT_ID
echo $env:ARM_CLIENT_ID
echo $env:ARM_CLIENT_SECRET
```
![vm](./images/2.1.0.jpg)
![vm](./images/2.1.1.jpg)
![vm](./images/2.1.2.jpg)

---
<a name="docker"></a><!-- 3 -->
### Install docker 

```sh
sudo apt update -y

sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
   
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update -y && sudo apt-get install docker-ce docker-ce-cli containerd.io -y
```
![runners](./images/3.0.0.jpg)

---
<a name="runner"></a><!-- 4 -->
### Install and setup gitlab-runner 

![runners](./images/4.0.0.jpg)

```sh
curl -LJO "https://gitlab-runner-downloads.s3.amazonaws.com/latest/deb/gitlab-runner_amd64.deb"
sudo dpkg -i gitlab-runner_amd64.deb
gitlab-runner -v
sudo usermod -aG docker gitlab-runner
sudo gitlab-runner register

# register setup
sudo gitlab-runner register -n \
  --url https://gitlab.com/ \
  --registration-token bri-JvsxgsTy...... \
  --executor docker \
  --description 'my1_docker' \
  --docker-image "docker" \
  --docker-privileged=true \
  --tag-list "my1_docker" \
  --docker-volumes '/cache' \
  --docker-volumes '/var/run/docker.sock:/var/run/docker.sock' 

sudo gitlab-runner register -n \
  --url https://gitlab.com/ \
  --registration-token bri-JvsxgsT...... \
  --executor shell \
  --tag-list "my1_shell" \
  --description "my1_shell" 


sudo gitlab-runner list
sudo gitlab-runner unregister --name my1_docker
sudo gitlab-runner unregister --name my1_shell

sudo cat /etc/gitlab-runner/config.toml
```
![runners](./images/4.0.1.jpg)

---
<a name="kubectl"></a><!-- 5 -->
### Install and setup kubectl

```sh
curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl

chmod +x ./kubectl

sudo mv ./kubectl /usr/local/bin/kubectl

kubectl version --client
```
![kubectl](./images/5.0.0.jpg)

---
<a name="gcloud"></a><!-- 6 -->
### Install and setup Google Cloud SDK

 ```sh
  echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
 
 sudo apt-get install apt-transport-https ca-certificates gnupg
 
 curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -

 sudo apt-get update -y
 
 sudo apt-get install google-cloud-sdk -y 
 
 gcloud version
```
![gcloud](./images/6.0.0.jpg)

---
<a name="helm"></a><!-- 7 -->
### Install and setup Helm 

```sh
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3

chmod 700 get_helm.sh

./get_helm.sh

helm version
```
![helm](./images/7.0.0.jpg)

---
<a name="cicd"><!-- 8 -->
### CI/CD</a>

For CI/CD we will use GitLab, use 2 runners "my1_docker" and "my1_shell", which is configured on our VM

Creat file [gitlab-ci.yml](https://github.com/shagovAlexei/titra/blob/master/.gitlab-ci.yml) and setup pipeline

![cicd](./images/8.0.0.jpg)
![cicd](./images/8.0.1.jpg)



### Container Registry
![cicd](./images/8.0.2.jpg)

---
<a name="k8s"><!-- 9 -->
### Kubernetes as an orchestration</a>

- go to the Cloud console
- create an account and bind to it Google Cloud
- create a project and activate the required API
- establishing a working machine connection to Google Cloud via Google SDK
- link for validation, go to it
- create a cluster in Google Cloud
- give the runer access to the cluster
- creat helm chart [Chart.yaml](https://gitlab.com/shagov.alexei/titra-project/-/blob/master/AppHelmChart/Chart.yaml) and [values.yaml](https://gitlab.com/shagov.alexei/titra-project/-/blob/master/AppHelmChart/values.yaml)


```sh
# runner access to the cluster 
sudo -i -u gitlab-runner

# create a project and activate the required API
gcloud init 

gcloud services enable container.googleapis.com

# create a cluster in Google Cloud
gcloud container clusters create alex1

kubectl cluster-info

kubectl get componentstatuses

kubectl get nodes

kubectl get pods
```
![k8s](./images/9.0.0.jpg)
![k8s](./images/9.0.1.jpg)
![k8s](./images/9.0.2.jpg)
![k8s](./images/9.0.3.jpg)
![k8s](./images/9.0.4.jpg)
![k8s](./images/9.0.5.jpg)
![k8s](./images/9.0.6.jpg)


#
### useful commands
```sh
kubectl get all -o wide -n my-project
kubectl get deploy -o wide -n my-project
kubectl get pods -o wide -n my-project
kubectl get svc -o wide -n my-project
kubectl get pvc -o wide  -n my-project
helm list
helm history titra
helm rollback titra
helm delete titra
```

### Delete clusters

```sh
gcloud container clusters delete alex1
```

### Secret in clusters
```sh
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  password: $(echo -n "xxxxx" | base64 -w0)
  username: $(echo -n "yyyy" | base64 -w0)
```

---
<a name="alarm"><!-- 10 -->
### Alerting, logging and monitoring</a>

### Alerting:
- Google cloud console
- Monitoring -> Alerting
- Create policy -> Add condition
- Target -> resourse type (examp CPU Usage) - Configuration 
- ADD
- check  email manage
- alerts name 
- save

![alarm](./images/10.0.1.jpg)
![alarm](./images/10.0.2.jpg)
![alarm](./images/10.0.4.jpg)

### Add in cluster prometheus and grafana

```sh

helm repo add stable https://charts.helm.sh/stable
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install grafana-prometheus \
  -n titra-prod \
  -f prometheus_values.yaml \
  prometheus-community/kube-prometheus-stack

```

![alarm](./images/10.0.3.jpg)

### TODO: 
- need to make an ingress for the prometheus and grafana
- create and add Domain
- add ssl cert
- add backup DB

