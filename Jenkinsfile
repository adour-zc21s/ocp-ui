pipeline {
    agent any

    stages {
        stage('1. Pull Code') {
            steps {
                echo 'Pulling latest changes from Git...'
                // Jenkins automatically handles git checkout if configured with "Pipeline script from SCM"
                // Or you can explicitly run:
                sh 'git pull origin main' 
            }
        }

        stage('2. Build Project') {
            steps {
                echo 'Building React production bundle...'
                sh 'npm run build'
            }
        }

        stage('3. Restart PM2 Process') {
            steps {
                echo 'Restarting application with PM2...'
                sh 'pm2 restart ocp-ui'
            }
        }
    }
}