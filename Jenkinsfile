pipeline {
    agent any

    tools {
        // Must match the Node.js configuration name under "Global Tool Configuration" in Jenkins
        nodejs 'node' 
    }

    stages {
        stage('1. Pull Code') {
            steps {
                echo 'Pulling latest code from Git...'
                // Jenkins automatically checks out your repository when using "Pipeline script from SCM"
            }
        }

        stage('2. Build Project') {
            steps {
                echo 'Installing dependencies and building...'
                sh 'npm install'
                sh 'npm run build'
            }
        }

        stage('3. Start / Deploy Project') {
            steps {
                echo 'Deploying build output...'
                // Example: Copy production build to local Nginx directory
                sh 'rm -rf /var/www/html/*'
                sh 'cp -r build/* /var/www/html/'
            }
        }
    }
}