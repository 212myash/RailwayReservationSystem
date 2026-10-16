
#include "../include/BookingHistory.h"
#include <iostream>

using namespace std;

BookingHistory::BookingHistory()
    : head(nullptr), count(0) {}

BookingHistory::~BookingHistory() {
    clear();
}

void BookingHistory::addBooking(const Booking& booking) {
    Node* newNode = new Node(booking);

    if (head == nullptr) {
        head = newNode;
    } else {
        Node* current = head;

        while (current->next != nullptr) {
            current = current->next;
        }

        current->next = newNode;
    }

    count++;
}

void BookingHistory::displayHistory() const {
    if (isEmpty()) {
        cout << "No booking records found.\n";
        return;
    }

    cout << "\n===== LINKED LIST BOOKING HISTORY =====\n";

    Node* current = head;
    int position = 1;

    while (current != nullptr) {
        cout << "\nBooking " << position << '\n';
        current->booking.display();

        current = current->next;
        position++;
    }

    cout << "\nTotal bookings: " << count << '\n';
}

bool BookingHistory::searchByPNR(const string& pnr) const {
    Node* current = head;

    while (current != nullptr) {
        if (current->booking.getPNR() == pnr) {
            cout << "\nBooking found!\n";
            current->booking.display();
            return true;
        }

        current = current->next;
    }

    cout << "Booking not found.\n";
    return false;
}

bool BookingHistory::deleteByPNR(const string& pnr) {
    if (head == nullptr) {
        cout << "Booking not found.\n";
        return false;
    }

    // Case 1: Delete the first node.
    if (head->booking.getPNR() == pnr) {
        Node* temp = head;
        head = head->next;

        delete temp;
        count--;

        cout << "Booking deleted successfully.\n";
        return true;
    }

    // Cases 2 and 3: Delete a middle or last node.
    Node* current = head;

    while (current->next != nullptr) {
        if (current->next->booking.getPNR() == pnr) {
            Node* temp = current->next;
            current->next = temp->next;

            delete temp;
            count--;

            cout << "Booking deleted successfully.\n";
            return true;
        }

        current = current->next;
    }

    cout << "Booking not found.\n";
    return false;
}

bool BookingHistory::isEmpty() const {
    return head == nullptr;
}

int BookingHistory::getSize() const {
    return count;
}

void BookingHistory::clear() {
    while (head != nullptr) {
        Node* temp = head;
        head = head->next;
        delete temp;
    }

    count = 0;
}
