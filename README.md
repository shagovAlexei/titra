# Task 8: K8s, Clouds, CI/CD. Just do it!
Important points:

1. After the completion of development you will show a presentation of the project (Share screen + documentation).

Tasks:
1. Select an application from the list  (pay attention to the date of the last change in the project ): https://github.com/unicodeveloper/awesome-opensource-apps
2. Select an CI/CD. You can choose any option, but we recommend looking here: 
https://pages.awscloud.com/awsmp-wsm-dev-workshop-series-module3-evolving-to-continuous-deployment-ty.html
3. Select Cloud Service provider for your infrastructure.

What would we like to see? The created infrastructure in which it will be possible to build, deploy and test the application.  

The main things to look out for 
- Git integration;
- Setup/configure CI/CD;
- Application/s should be containerized;
- Scheduled backups for DB and all critical data;
- Logging and monitoring for your services;
- Security;
- Use Kubernetes as an orchestration (cloud provider is recommended);
- The project must be documented, step-by-step guides to deploy from scratch; 
EXTRA: SonarQube integration.

[![Docker build](https://github.com/kromitgmbh/titra/actions/workflows/push.yml/badge.svg)](https://github.com/kromitgmbh/titra/actions/workflows/push.yml) ![Docker Pulls](https://img.shields.io/docker/pulls/kromit/titra.svg) ![Latest Release](https://img.shields.io/github/v/release/kromitgmbh/titra.svg)

# ![titra logo](public/favicons/favicon-32x32.png) Exadel Internship project KroKusLab

Content:

[1. Integration Github with GitLab](#github_integration)

[2. Create Microsoft Azure VM](#vm)

[3. Install Docker](#docker)

[4. Install and setup gitlab-runner](#runners)

[5. Install and setup kubectl](#kubectl)

[6. Install and setup Google Cloud SDK](#gcloud)

...

---
<a name="github_integration"></a>Made a branch from the official repository  [Titra](https://github.com/kromitgmbh/titra) and configured web hook for integration with [GitLab repository of our project ](https://gitlab.com/shagov.alexei/titra-project).


![fork](./images/1.0.0.jpg )

Create personal access token
![fork](./images/1.0.1.jpg )

In GitLab, create a project, import and setup
![fork](./images/1.0.1.1.jpg )
![fork](./images/1.0.1.2.jpg )
![webhook](./images/1.0.2.jpg )
![webhook](./images/1.0.3.jpg )
![webhook](./images/1.0.4.jpg )
![webhook](./images/1.0.5.jpg )

---

<a name="vm"></a>
Created for the build, testing and deployment stages VM in Microsoft Azure
### 1. Manual
![vm](./images/2.0.0.jpg )

### 2. Using Terraform 
### [Terraform file link](https://gitlab.com/shagov.alexei/titra-project/-/blob/master/main.tf)

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

<a name="docker"></a>
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
---
<a name="runner"></a>
### Install and setup gitlab-runner
![runners](./images/4.0.0.jpg)

```sh
curl -LJO "https://gitlab-runner-downloads.s3.amazonaws.com/latest/deb/gitlab-runner_amd64.deb"
sudo dpkg -i gitlab-runner_amd64.deb
gitlab-runner -v
sudo usermod -aG docker gitlab-runner
sudo gitlab-runner register
```

```sh
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
<a name="kubectl"></a>
###  Install and setup kubectl
```sh
curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl

chmod +x ./kubectl

sudo mv ./kubectl /usr/local/bin/kubectl

kubectl version --client
```

---
<a name="kubectl"></a>

<a name="gcloud"></a>
### Install Google Cloud SDK
 ```sh
 echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
  sudo apt-get install apt-transport-https ca-certificates gnupg
 curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -

 sudo apt-get update -y && sudo apt-get install google-cloud-sdk -y 
 gcloud version
```

---
### Install and setup  Helm
```sh
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3

chmod 700 get_helm.sh

./get_helm.sh
```