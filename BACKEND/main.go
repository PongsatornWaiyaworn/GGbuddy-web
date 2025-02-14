package main

import (
	"fmt"
	"log"
	"net/http"

	"ggbuddy/handlers"
)

func main() {
	// http.HandleFunc("/", handlers.HomeHandler)
	http.HandleFunc("/login", handlers.LoginHandler)
	http.HandleFunc("/register", handlers.RegisterHandler)

	fmt.Println("Server started at http://localhost:8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
