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

                echo 'Building React production bundle without source maps...'
                sh 'DISABLE_ESLINT_PLUGIN=true CI=false GENERATE_SOURCEMAP=false npm run build'
            }
        }

        stage('3. Restart PM2 Process') {
            steps {
                echo 'Restarting application with PM2...'
                sh '''
                    cd "$WORKSPACE"
                    pm2 delete ocp-ui || true
                    pm2 start "npx serve -s build -l 3000" --name "ocp-ui"
                '''
            }
        }
    }
}