pipeline {
    agent any

    stages {
        stage('1. Pull Code') {
            steps {
                echo 'Pulling latest changes from Git...'
                // Note: Jenkins automatically checks out the latest code when using SCM, 
                // but keeping explicit git pull is fine if needed.
            }
        }

        stage('2. Build Project') {
            steps {
                echo 'Installing dependencies...'
                sh 'npm install'

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