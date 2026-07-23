pipeline {
    agent any

    stages {
        stage('1. Pull Code') {
            steps {
                echo 'Pulling latest code...'
            }
        }

        stage('2. Build Project') {
            steps {
                echo 'Installing dependencies...'
                sh 'npm install'

                echo 'Building React production bundle...'
                // Ignore ESLint errors during production build
                sh 'DISABLE_ESLINT_PLUGIN=true CI=false npm run build'
            }
        }

        stage('3. Restart PM2 Process') {
            steps {
                echo 'Restarting application with PM2...'
                // Replace 'ubuntu' with the actual user that started PM2
                sh 'sudo -u ng pm2 restart ocp-ui'
            }
        }
    }
}