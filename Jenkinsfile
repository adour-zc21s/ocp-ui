pipeline {
    agent any

    stages {
        stage('1. Pull Code') {
            steps {
                echo 'Cleaning workspace and pulling latest code...'
                // 1. Clean old files from workspace
                cleanWs()
                // 2. Explicitly pull the repository code back into workspace
                checkout scm
            }
        }

        stage('2. Build Project') {
            steps {
                echo 'Installing dependencies...'
                sh 'npm install'
        
                echo 'Cleaning previous build folder...'
                sh 'rm -rf build'
        
                echo 'Building React production bundle without source maps...'
                sh 'DISABLE_ESLINT_PLUGIN=true CI=false GENERATE_SOURCEMAP=false npm run build'
        
                // Check if "Tickets" is still being generated in the build output
                sh 'grep -rn "Tickets" build/static/js/ || echo "No references to Tickets found in build!"'
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