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
                echo 'Installing dependencies fast via npm ci...'
                sh 'npm ci --prefer-offline'
        
                echo 'Building React production bundle without source maps...'
                // GENERATE_SOURCEMAP=false drastically speeds up Webpack build time
                sh 'DISABLE_ESLINT_PLUGIN=true CI=false GENERATE_SOURCEMAP=false npm run build'
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