#! /bin/bash

# docker
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

sudo apt update -y 

sudo apt-get install docker-ce docker-ce-cli containerd.io -y


# runner
curl -LJO "https://gitlab-runner-downloads.s3.amazonaws.com/latest/deb/gitlab-runner_amd64.deb"
sudo dpkg -i gitlab-runner_amd64.deb
gitlab-runner -v
sudo usermod -aG docker gitlab-runner

sudo gitlab-runner register -n \
  --url https://gitlab.com/ \
  --registration-token bri-JvsxgsTy9U....... \
  --executor docker \
  --description 'my1_docker' \
  --docker-image "docker" \
  --docker-privileged=true \
  --tag-list "my1_docker" \
  --docker-volumes '/cache' \
  --docker-volumes '/var/run/docker.sock:/var/run/docker.sock' 

sudo gitlab-runner register -n \
  --url https://gitlab.com/ \
  --registration-token bri-JvsxgsTy9U........ \
  --executor shell \
  --tag-list "my1_shell" \
  --description "my1_shell" 

sudo gitlab-runner list
sudo cat /etc/gitlab-runner/config.toml
sudo gitlab-runner restart

cd /home/gitlab-runner
sudo rm .bash_logout

# *** kubectl ***
curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl
chmod +x ./kubectl
sudo mv ./kubectl /usr/local/bin/kubectl
kubectl version --client

source <(kubectl completion bash)
echo "source <(kubectl completion bash)" >> ~/.bashrc
alias kc=kubectl
complete -F __start_kubectl kc

#  *** Installing Cloud SDK  ***
 echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
  sudo apt-get install apt-transport-https ca-certificates gnupg
 curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
 sudo apt-get update -y && sudo apt-get install google-cloud-sdk -y 
 gcloud version

# *** Helm installer ***
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
