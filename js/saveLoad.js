// saveLoad.js - System for saving and loading collider transform parameters

export class SaveLoadController {
    constructor() {
        this.dataFilePath = 'assets/data.json';
        this.collisionMesh = null;
    }

    setCollisionMesh(collisionMesh) {
        this.collisionMesh = collisionMesh;
        console.log('Collision mesh set for save/load system');
        
        // Auto-load transform data when mesh is set
        this.loadTransform();
    }

    // Save current collider transform to JSON file
    async saveTransform() {
        if (!this.collisionMesh) {
            console.warn('No collision mesh to save');
            return false;
        }

        try {
            const transformData = {
                position: {
                    x: this.collisionMesh.position.x,
                    y: this.collisionMesh.position.y,
                    z: this.collisionMesh.position.z
                },
                rotation: {
                    x: this.collisionMesh.rotation.x,
                    y: this.collisionMesh.rotation.y,
                    z: this.collisionMesh.rotation.z
                },
                scale: {
                    x: this.collisionMesh.scale.x,
                    y: this.collisionMesh.scale.y,
                    z: this.collisionMesh.scale.z
                },
                savedAt: new Date().toISOString()
            };

            // Create the JSON content
            const jsonContent = JSON.stringify(transformData, null, 2);

            // Create a download link for the JSON file
            const blob = new Blob([jsonContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('Transform data saved:', transformData);
            console.log('Please place the downloaded data.json file in the assets/ folder');
            
            return true;
        } catch (error) {
            console.error('Failed to save transform:', error);
            return false;
        }
    }

    // Load collider transform from JSON file
    async loadTransform() {
        if (!this.collisionMesh) {
            console.warn('No collision mesh to load transform to');
            return false;
        }

        try {
            const response = await fetch(this.dataFilePath);
            
            if (!response.ok) {
                console.log('No saved transform data found (data.json not found)');
                return false;
            }

            const transformData = await response.json();

            // Apply the loaded transform to the collision mesh
            if (transformData.position) {
                this.collisionMesh.position.set(
                    transformData.position.x || 0,
                    transformData.position.y || 0,
                    transformData.position.z || 0
                );
            }

            if (transformData.rotation) {
                this.collisionMesh.rotation.set(
                    transformData.rotation.x || 0,
                    transformData.rotation.y || 0,
                    transformData.rotation.z || 0
                );
            }

            if (transformData.scale) {
                this.collisionMesh.scale.set(
                    transformData.scale.x || 1,
                    transformData.scale.y || 1,
                    transformData.scale.z || 1
                );
            }

            console.log('Transform data loaded successfully:', transformData);
            console.log(`Data saved at: ${transformData.savedAt || 'Unknown'}`);
            
            return true;
        } catch (error) {
            console.error('Failed to load transform:', error);
            return false;
        }
    }

    // Get current transform data (for debugging)
    getCurrentTransform() {
        if (!this.collisionMesh) {
            return null;
        }

        return {
            position: {
                x: this.collisionMesh.position.x,
                y: this.collisionMesh.position.y,
                z: this.collisionMesh.position.z
            },
            rotation: {
                x: this.collisionMesh.rotation.x,
                y: this.collisionMesh.rotation.y,
                z: this.collisionMesh.rotation.z
            },
            scale: {
                x: this.collisionMesh.scale.x,
                y: this.collisionMesh.scale.y,
                z: this.collisionMesh.scale.z
            }
        };
    }

    // Reset transform to default values
    resetTransform() {
        if (!this.collisionMesh) {
            console.warn('No collision mesh to reset');
            return false;
        }

        this.collisionMesh.position.set(0, 0, 0);
        this.collisionMesh.rotation.set(0, 0, 0);
        this.collisionMesh.scale.set(1, 1, 1);

        console.log('Transform reset to default values');
        return true;
    }
}