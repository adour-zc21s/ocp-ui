pipeline {
    agent any

    stages {
        stage('1. Pull Code') {
            steps {
                // 2. Explicitly pull the repository code back into workspace
                checkout scm
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
                    # Stop and completely flush PM2 process and logs
                    pm2 delete ocp-ui || true
                    pm2 flush

                    # Start fresh static server
                    pm2 start "npx serve -s build -l 3000 --no-clipboard" --name "ocp-ui"
                '''
            }
        }
    }
}