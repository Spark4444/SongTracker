import fs from "fs";
import path from "path";
import assert from "assert";
import {
    readAllUsers,
    writeNewUser,
    findUserById,
    updateUser,
    deleteUser
} from "../src/controllers/usersController.js";
import WebError from "../src/WebError/WebError.js";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const testUsersFilePath = path.join(__dirname, "../src/db/users_test.json");
const originalUsersFilePath = path.join(__dirname, "../src/db/users.json");

// Test setup and teardown helpers
function setupTestDatabase() {
    // Backup original users.json
    if (fs.existsSync(originalUsersFilePath)) {
        fs.copyFileSync(originalUsersFilePath, originalUsersFilePath + ".backup");
    }
    
    // Create clean test data
    const testData = [];
    fs.writeFileSync(originalUsersFilePath, JSON.stringify(testData, null, 2), "utf-8");
}

function teardownTestDatabase() {
    // Restore original users.json
    if (fs.existsSync(originalUsersFilePath + ".backup")) {
        fs.copyFileSync(originalUsersFilePath + ".backup", originalUsersFilePath);
        fs.unlinkSync(originalUsersFilePath + ".backup");
    }
}

function createValidUser(name = "Test User", email = "test@example.com", trackedSongs = []) {
    return {
        name,
        email,
        trackedSongs
    };
}

// Test Suite
function runUserDatabaseTests() {
    console.log("🚀 Starting User Database Tests...\n");

    // Test 1: readAllUsers() with empty database
    function testReadAllUsersEmpty() {
        console.log("📋 Test 1: Reading from empty database");
        setupTestDatabase();
        
        try {
            const users = readAllUsers();
            assert.deepStrictEqual(users, []);
            console.log("✅ Successfully read empty user array\n");
        } catch (error) {
            console.log("❌ Test failed:", error.message);
            throw error;
        } finally {
            teardownTestDatabase();
        }
    }

    // Test 2: readAllUsers() when file doesn't exist
    function testReadAllUsersFileNotExists() {
        console.log("📋 Test 2: Reading when users.json doesn't exist");
        
        try {
            // Remove the file if it exists
            if (fs.existsSync(originalUsersFilePath)) {
                fs.unlinkSync(originalUsersFilePath);
            }
            
            const users = readAllUsers();
            assert.deepStrictEqual(users, []);
            assert(fs.existsSync(originalUsersFilePath), "users.json should be created");
            console.log("✅ Successfully created users.json and returned empty array\n");
        } catch (error) {
            console.log("❌ Test failed:", error.message);
            throw error;
        } finally {
            teardownTestDatabase();
        }
    }

    // Test 3: writeNewUser() with valid user
    function testWriteValidUser() {
        console.log("📋 Test 3: Writing valid user");
        setupTestDatabase();
        
        try {
            const newUser = createValidUser("John Doe", "john@example.com", ["song1", "song2"]);
            writeNewUser(newUser);
            
            const users = readAllUsers();
            assert.strictEqual(users.length, 1);
            assert.deepStrictEqual(users[0], newUser);
            console.log("✅ Successfully wrote valid user\n");
        } catch (error) {
            console.log("❌ Test failed:", error.message);
            throw error;
        } finally {
            teardownTestDatabase();
        }
    }

    // Test 4: writeNewUser() with invalid user (missing fields)
    function testWriteInvalidUserMissingFields() {
        console.log("📋 Test 4: Writing user with missing fields");
        setupTestDatabase();
        
        try {
            const invalidUser = { name: "John", email: "john@example.com" }; // missing trackedSongs
            
            assert.throws(() => {
                writeNewUser(invalidUser);
            }, WebError, "Should throw WebError for missing fields");
            
            console.log("✅ Correctly rejected user with missing fields\n");
        } catch (error) {
            if (error.name === 'AssertionError') {
                console.log("❌ Test failed:", error.message);
                throw error;
            }
            console.log("❌ Unexpected error:", error.message);
            throw error;
        } finally {
            teardownTestDatabase();
        }
    }

    // Test 5: writeNewUser() with invalid trackedSongs type
    function testWriteInvalidUserBadTrackedSongs() {
        console.log("📋 Test 5: Writing user with invalid trackedSongs type");
        setupTestDatabase();
        
        try {
            const invalidUser = createValidUser("John", "john@example.com", "not_an_array");
            
            assert.throws(() => {
                writeNewUser(invalidUser);
            }, WebError, "Should throw WebError for invalid trackedSongs type");
            
            console.log("✅ Correctly rejected user with invalid trackedSongs type\n");
        } catch (error) {
            if (error.name === 'AssertionError') {
                console.log("❌ Test failed:", error.message);
                throw error;
            }
            console.log("❌ Unexpected error:", error.message);
            throw error;
        } finally {
            teardownTestDatabase();
        }
    }

    // Test 6: findUserById() with existing user
    function testFindExistingUser() {
        console.log("📋 Test 6: Finding existing user by ID");
        setupTestDatabase();
        
        try {
            const user1 = createValidUser("User 1", "user1@example.com");
            const user2 = createValidUser("User 2", "user2@example.com");
            writeNewUser(user1);
            writeNewUser(user2);
            
            const foundUser = findUserById(0); // Array index as ID
            assert.deepStrictEqual(foundUser, user1);
            
            const foundUser2 = findUserById(1);
            assert.deepStrictEqual(foundUser2, user2);
            
            console.log("✅ Successfully found users by ID\n");
        } catch (error) {
            console.log("❌ Test failed:", error.message);
            throw error;
        } finally {
            teardownTestDatabase();
        }
    }

    // Test 7: findUserById() with non-existing user
    function testFindNonExistingUser() {
        console.log("📋 Test 7: Finding non-existing user by ID");
        setupTestDatabase();
        
        try {
            assert.throws(() => {
                findUserById(999);
            }, WebError, "Should throw WebError for non-existing user");
            
            console.log("✅ Correctly threw error for non-existing user\n");
        } catch (error) {
            if (error.name === 'AssertionError') {
                console.log("❌ Test failed:", error.message);
                throw error;
            }
            console.log("❌ Unexpected error:", error.message);
            throw error;
        } finally {
            teardownTestDatabase();
        }
    }

    // Test 8: updateUser() with valid data
    function testUpdateExistingUser() {
        console.log("📋 Test 8: Updating existing user");
        setupTestDatabase();
        
        try {
            const originalUser = createValidUser("Original Name", "original@example.com", ["song1"]);
            writeNewUser(originalUser);
            
            const updateData = {
                name: "Updated Name",
                trackedSongs: ["song1", "song2", "song3"]
            };
            
            updateUser(0, updateData);
            
            const updatedUser = findUserById(0);
            assert.strictEqual(updatedUser.name, "Updated Name");
            assert.strictEqual(updatedUser.email, "original@example.com"); // Should remain unchanged
            assert.deepStrictEqual(updatedUser.trackedSongs, ["song1", "song2", "song3"]);
            
            console.log("✅ Successfully updated user\n");
        } catch (error) {
            console.log("❌ Test failed:", error.message);
            throw error;
        } finally {
            teardownTestDatabase();
        }
    }

    // Test 9: updateUser() with non-existing user
    function testUpdateNonExistingUser() {
        console.log("📋 Test 9: Updating non-existing user");
        setupTestDatabase();
        
        try {
            assert.throws(() => {
                updateUser(999, { name: "New Name" });
            }, WebError, "Should throw WebError for non-existing user");
            
            console.log("✅ Correctly threw error for updating non-existing user\n");
        } catch (error) {
            if (error.name === 'AssertionError') {
                console.log("❌ Test failed:", error.message);
                throw error;
            }
            console.log("❌ Unexpected error:", error.message);
            throw error;
        } finally {
            teardownTestDatabase();
        }
    }

    // Test 10: deleteUser() with existing user
    function testDeleteExistingUser() {
        console.log("📋 Test 10: Deleting existing user");
        setupTestDatabase();
        
        try {
            const user1 = createValidUser("User 1", "user1@example.com");
            const user2 = createValidUser("User 2", "user2@example.com");
            writeNewUser(user1);
            writeNewUser(user2);
            
            deleteUser(0); // Delete first user
            
            const users = readAllUsers();
            assert.strictEqual(users.length, 1);
            assert.deepStrictEqual(users[0], user2);
            
            console.log("✅ Successfully deleted user\n");
        } catch (error) {
            console.log("❌ Test failed:", error.message);
            throw error;
        } finally {
            teardownTestDatabase();
        }
    }

    // Test 11: deleteUser() with non-existing user
    function testDeleteNonExistingUser() {
        console.log("📋 Test 11: Deleting non-existing user");
        setupTestDatabase();
        
        try {
            assert.throws(() => {
                deleteUser(999);
            }, WebError, "Should throw WebError for non-existing user");
            
            console.log("✅ Correctly threw error for deleting non-existing user\n");
        } catch (error) {
            if (error.name === 'AssertionError') {
                console.log("❌ Test failed:", error.message);
                throw error;
            }
            console.log("❌ Unexpected error:", error.message);
            throw error;
        } finally {
            teardownTestDatabase();
        }
    }

    // Test 12: Multiple operations integration test
    function testMultipleOperationsIntegration() {
        console.log("📋 Test 12: Multiple operations integration test");
        setupTestDatabase();
        
        try {
            // Add multiple users
            writeNewUser(createValidUser("Alice", "alice@example.com", ["song1"]));
            writeNewUser(createValidUser("Bob", "bob@example.com", ["song2"]));
            writeNewUser(createValidUser("Charlie", "charlie@example.com", ["song3"]));
            
            let users = readAllUsers();
            assert.strictEqual(users.length, 3);
            
            // Update middle user
            updateUser(1, { trackedSongs: ["song2", "song4"] });
            
            // Verify update
            const updatedBob = findUserById(1);
            assert.deepStrictEqual(updatedBob.trackedSongs, ["song2", "song4"]);
            
            // Delete first user
            deleteUser(0);
            
            users = readAllUsers();
            assert.strictEqual(users.length, 2);
            
            console.log("✅ Successfully completed integration test\n");
        } catch (error) {
            console.log("❌ Test failed:", error.message);
            throw error;
        } finally {
            teardownTestDatabase();
        }
    }

    // Run all tests
    try {
        testReadAllUsersEmpty();
        testReadAllUsersFileNotExists();
        testWriteValidUser();
        testWriteInvalidUserMissingFields();
        testWriteInvalidUserBadTrackedSongs();
        testFindExistingUser();
        testFindNonExistingUser();
        testUpdateExistingUser();
        testUpdateNonExistingUser();
        testDeleteExistingUser();
        testDeleteNonExistingUser();
        testMultipleOperationsIntegration();
        
        console.log("🎉 All User Database Tests Passed! 🎉");
    } catch (error) {
        console.log("\n💥 Test Suite Failed!");
        console.log("Error details:", error.message);
        process.exit(1);
    }
}

// Export the test runner for potential use in other test files
export { runUserDatabaseTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runUserDatabaseTests();
}